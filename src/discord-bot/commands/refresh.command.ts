/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from "@nestjs/common";
import {
    Client,
    ComponentType,
    Interaction,
    InteractionContextType,
    Message,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
    ButtonInteraction,
    CommandInteraction,
} from "discord.js";
import { CommandModules } from "../modules.type";

@Injectable()
export class RefreshCommand {
    public static enabled: boolean = true;

    constructor(
        private client: Client,
        private modules: CommandModules
    ) {
        this.register(modules);
    }

    private async performRefresh(
        interaction: CommandInteraction | ButtonInteraction,
        spreadsheetId: string,
        sheetName: string,
        mode: "all" | "new" = "all"
    ) {
        try {
            const registeredIds =
                await this.modules.SpreadsheetService.getAllOsuIds(
                    spreadsheetId,
                    sheetName
                );

            if (!registeredIds || registeredIds.length === 0) {
                await interaction.editReply("No registered users found.");
                return;
            }

            let idsToFetch: string[] = registeredIds;

            if (mode === "new") {
                const existingIds =
                    await this.modules.SpreadsheetService.getOsuIdsFromStats(
                        spreadsheetId,
                        sheetName
                    );
                
                // Convert to Set for faster lookup
                const existingSet = new Set(existingIds.map(String));
                idsToFetch = registeredIds.filter(id => !existingSet.has(String(id)));

                if (idsToFetch.length === 0) {
                    await interaction.editReply("No new users to refresh.");
                    return;
                }
            }

            const users = await this.modules.OsuService.getMultipleUsers(idsToFetch);

            if (mode === "all") {
                await this.modules.SpreadsheetService.updateOsuStats(
                    spreadsheetId,
                    sheetName,
                    users
                );
            } else {
                await this.modules.SpreadsheetService.appendOsuStats(
                    spreadsheetId,
                    sheetName,
                    users
                );
            }

            await interaction.editReply(
                `Successfully refreshed statistics for ${users.length} users (${mode === 'all' ? 'Force All' : 'New Only'}).`
            );
        } catch (err) {
            console.error(err);
            await interaction.editReply(
                "Failed to refresh sheet. Please check the bot's permissions and try again."
            );
        }
    }

    private async onButtonInteraction(interaction: ButtonInteraction) {
        const customId = interaction.customId;
        if (customId !== "refresh_all" && customId !== "refresh_new") return;

        const message_id = interaction.message.id;
        const chat_data =
            await this.modules.DatabaseService.getChatSpreadsheet(message_id);

        if (!chat_data) {
            return await interaction.reply({
                content: "This button is no longer linked to a configuration.",
                flags: [MessageFlags.Ephemeral],
            });
        }

        const { spreadsheet_id, sheet_name } = chat_data;

        await interaction.deferReply({
            flags: [MessageFlags.Ephemeral],
        });

        await this.performRefresh(
            interaction, 
            spreadsheet_id, 
            sheet_name, 
            customId === "refresh_new" ? "new" : "all"
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private register(modules: CommandModules) {
        this.client.on("interactionCreate", async (interaction) => {
            if (interaction.isChatInputCommand()) {
                const { commandName, options } = interaction;
                const subCommand = options.getSubcommand(true);

                if (commandName !== "refresh") {
                    return;
                }

                if (subCommand === "run-once") {
                    const spreadsheetId = options.getString(
                        "spreadsheetid",
                        true
                    );
                    const sheetName =
                        options.getString("sheetname", false) ??
                        "Miu Bot Registrants";

                    await interaction.deferReply({
                        flags: [MessageFlags.Ephemeral],
                    });

                    await this.performRefresh(
                        interaction,
                        spreadsheetId,
                        sheetName,
                        "all"
                    );
                } else if (subCommand === "create") {
                    const spreadsheetId = options.getString(
                        "spreadsheetid",
                        true
                    );
                    const sheetName =
                        options.getString("sheetname", false) ??
                        "Miu Bot Registrants";
                    const content =
                        options.getString("content", false) ??
                        "Use the buttons below to refresh osu! statistics.";

                    await interaction.deferReply({
                        flags: [MessageFlags.Ephemeral],
                    });

                    try {
                        const chat = await interaction.channel.send({
                            content,
                            components: [
                                {
                                    type: 1,
                                    components: [
                                        {
                                            custom_id: "refresh_all",
                                            type: 2,
                                            style: 4, // Danger/Red
                                            label: "Force Refresh All",
                                            emoji: {
                                                name: "🔄",
                                                animated: false,
                                            },
                                        },
                                        {
                                            custom_id: "refresh_new",
                                            type: 2,
                                            style: 1, // Primary/Blurple
                                            label: "Refresh Only New Ones",
                                            emoji: {
                                                name: "🆕",
                                                animated: false,
                                            },
                                        },
                                    ],
                                },
                            ],
                        });

                        await modules.DatabaseService.setChatSpreadsheet(
                            chat.id,
                            chat.channel.id,
                            spreadsheetId,
                            sheetName,
                            { type: "refresh" }
                        );

                        await interaction.editReply("Refresh buttons created!");
                    } catch (err) {
                        console.error(err);
                        await interaction.editReply(
                            "Failed to create refresh buttons. Check permissions."
                        );
                    }
                }
            } else if (interaction.isButton()) {
                await this.onButtonInteraction(interaction);
            }
        });
    }

    public async onBotReady() {}

    public getCommand() {
        return {
            name: "refresh",
            description: "Refresh Core Command",
            options: [
                {
                    type: 1,
                    name: "run-once",
                    description: "Refresh osu! usernames and ranks once (Force All)",
                    options: [
                        {
                            type: 3,
                            name: "spreadsheetid",
                            description: "Target spreadsheet Id",
                            required: true,
                        },
                        {
                            type: 3,
                            name: "sheetname",
                            description:
                                'Target sheet name, defaults to "Miu Bot Registrants"',
                        },
                    ],
                },
                {
                    type: 1,
                    name: "create",
                    description:
                        "Create persistent buttons to refresh statistics",
                    options: [
                        {
                            type: 3,
                            name: "spreadsheetid",
                            description: "Target spreadsheet Id",
                            required: true,
                        },
                        {
                            type: 3,
                            name: "sheetname",
                            description:
                                'Target sheet name, defaults to "Miu Bot Registrants"',
                        },
                        {
                            type: 3,
                            name: "content",
                            description: "Message content above the buttons",
                        },
                    ],
                },
            ],
            default_member_permissions: `${PermissionFlagsBits.ManageChannels}`,
            contexts: [InteractionContextType.Guild],
        };
    }
}
