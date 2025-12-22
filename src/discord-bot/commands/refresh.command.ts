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
        mode: "all" | "new" | "hitomi" = "all",
        gamemode: string = "osu"
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
            } else if (mode === "new") {
                await this.modules.SpreadsheetService.appendOsuStats(
                    spreadsheetId,
                    sheetName,
                    users
                );
            } else if (mode === "hitomi") {
                await this.modules.SpreadsheetService.updateHitomiStats(
                    spreadsheetId,
                    sheetName,
                    users,
                    gamemode
                );
            }

            await interaction.editReply(
                `Successfully refreshed statistics for ${users.length} users (${mode === 'hitomi' ? `Hitomi - ${gamemode}` : (mode === 'all' ? 'Force All' : 'New Only')}).`
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

        if (customId === "refresh_hitomi") {
            const message_id = interaction.message.id;
            await interaction.reply({
                content: "Select a gamemode for Hitomi refresh:",
                flags: [MessageFlags.Ephemeral],
                components: [
                    {
                        type: 1,
                        components: [
                            { type: 2, style: 1, label: "osu!", custom_id: `refresh_hitomi_mode:osu:${message_id}` },
                            { type: 2, style: 1, label: "Taiko", custom_id: `refresh_hitomi_mode:taiko:${message_id}` },
                            { type: 2, style: 1, label: "Catch", custom_id: `refresh_hitomi_mode:fruits:${message_id}` },
                            { type: 2, style: 1, label: "Mania", custom_id: `refresh_hitomi_mode:mania:${message_id}` },
                        ]
                    }
                ]
            });
            return;
        }

        let message_id: string;
        let mode: "all" | "new" | "hitomi" = "all";
        let gamemode: string = "osu";

        if (customId === "refresh_all") {
            message_id = interaction.message.id;
            mode = "all";
        } else if (customId === "refresh_new") {
            message_id = interaction.message.id;
            mode = "new";
        } else if (customId.startsWith("refresh_hitomi_mode:")) {
            const parts = customId.split(":");
            gamemode = parts[1];
            message_id = parts[2];
            mode = "hitomi";
        } else {
            return;
        }

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
            mode,
            gamemode
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
                                        {
                                            custom_id: "refresh_hitomi",
                                            type: 2,
                                            style: 3, // Success/Green
                                            label: "Refresh to Hitomi",
                                            emoji: {
                                                name: "✅",
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
