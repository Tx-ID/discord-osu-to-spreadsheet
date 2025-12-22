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
} from "discord.js";
import { CommandModules } from "../modules.type";

import { encrypt, decrypt } from "src/utilities/crypto.utility";

@Injectable()
export class CreateCommand {
    public static enabled: boolean = true;

    constructor(
        private client: Client,
        private modules: CommandModules
    ) {
        this.register(modules);
    }

    private normalizeSpaces(str: string): string {
        return str.replace(/\s+/g, ' ').trim();
    }

    private sanitizeString(str: string): string {
        return this.normalizeSpaces(str.normalize("NFC").trim());
    }

    private async onJoin(
        interaction: ButtonInteraction,
        spreadsheet_id: string,
        sheet_name: string,
        message_id: string
    ) {
        try {
            const chat_data = await this.modules.DatabaseService.getChatSpreadsheet(message_id);
            const flags = chat_data?.other_data?.flags ?? {};

            const user = await this.modules.DatabaseService.getOsuByDiscord(
                interaction.user.id
            );
            if (!user) return await interaction.editReply("?");
            if (user.is_restricted)
                return await interaction.editReply(
                    "You can't join this tournament."
                );
            
            if (flags['4wc_2025']) {
                const sheet = await this.modules.SpreadsheetService.get('1_DWIlcFu985vNeNzSspWqjeJHva0X04fSNZA_2B0YPA');
                if (!sheet)
                    return await interaction.editReply(`Failed to check other's sheet for validation.\n**It's not your fault!**`);

                const rows: string[][] = await sheet.getSheetData('registrations!L8:L');
                if (!rows)
                    return await interaction.editReply(`Failed to check other's sheet for validation. (2)\n**It's not your fault!**`);

                let found = false;
                const targetUser = this.sanitizeString(user.osuUsername);
                let i = 0;
                for (const n of rows) {
                    if (++i % 50 === 0) await new Promise(resolve => setTimeout(resolve, 0));

                    const names = n[0];
                    const list = names.split(',  ').map(n => this.sanitizeString(n));
                    if (list.includes(targetUser)){
                        found = true;
                        break;
                    }
                }
                if (!found)
                    return await interaction.editReply(
                        '[Please register elsewhere first by clicking this text.](<https://r.shdewz.me/4wc25-registration>)\n-# Please wait a moment before pressing join button again after registering.'
                    );
            }

            const get_osu_id =
                await this.modules.SpreadsheetService.checkDiscordIdExistInRegistration(
                    spreadsheet_id,
                    sheet_name,
                    user.discordId
                );
            const get_discord_id = 
                await this.modules.SpreadsheetService.checkOsuIdExistInRegistration(
                    spreadsheet_id,
                    sheet_name,
                    user.osuId
                );

            if (!get_osu_id && !get_discord_id) {
                await this.modules.SpreadsheetService.appendSheetForOsuRegistration(
                    spreadsheet_id,
                    sheet_name,
                    user.discordId,
                    interaction.user.username,
                    user.osuId,
                    user.osuUsername
                );
                await interaction.editReply("You are now registered!");

            } else {
                if (get_osu_id) {
                    const profile =
                        await this.modules.OsuService.getUser(get_osu_id);
                    await interaction.editReply(
                        `You already registered as **${profile.username}**. Press the unregister button if you want to unregister yourself.`
                    );

                } else if (get_discord_id) {
                    await interaction.editReply(
                        `Someone already registered using that osu account.`
                    );

                }
            }
        } catch (err) {
            console.log(err);
            await interaction.editReply(
                "Failed during process. It's not your fault!"
            );
        }
    }

    private async onButtonInteraction(interaction: ButtonInteraction) {
        if (interaction.component.disabled) return;

        const customId = interaction.customId;
        let message_id: string;
        let action = customId;

        if (customId === "register" || customId === "unregister") {
             message_id = interaction.message.id;
        } else if (customId.startsWith("join:") || customId.startsWith("logout:")) {
             const parts = customId.split(":");
             action = parts[0];
             message_id = parts[1];
        } else {
            return;
        }

        const chat_data = await this.modules.DatabaseService.getChatSpreadsheet(message_id);
        if (!chat_data) {
             return await interaction.reply({
                 content: "Registration is no longer valid. It's not your fault!",
                 flags: [MessageFlags.Ephemeral],
             });
        }

        const { spreadsheet_id, sheet_name } = chat_data;

        await interaction.deferReply({
            flags: [MessageFlags.Ephemeral],
        });

        if (action === "register") {
            try {
                const state = this.modules.OsuAuthService.generateState(
                    interaction.guildId,
                    interaction.user.id
                );

                const user =
                    await this.modules.DatabaseService.getOsuByDiscord(
                        interaction.user.id
                    );
                if (user) {
                    const profile = await this.modules.OsuService.getUser(
                        user.osuId
                    );

                    await interaction.editReply({
                        content: `You are logged in as [**${profile.username}**](<https://osu.ppy.sh/users/${user.osuId}>) in osu!`, 
                        embeds: [],
                        components: [
                            {
                                type: 1,
                                components: [
                                    {
                                        custom_id: `join:${message_id}`,
                                        type: 2,
                                        style: 3,
                                        label: "Join Tournament",
                                        emoji: {
                                            name: "🎟️",
                                            animated: false,
                                        },
                                    },
                                    {
                                        custom_id: `logout:${message_id}`,
                                        type: 2,
                                        style: 4,
                                        label: "Logout from Bot",
                                        emoji: {
                                            name: "👋",
                                            animated: false,
                                        },
                                    },
                                ],
                            },
                        ],
                    });
                } else {
                    await interaction.editReply({
                        content: `You are not logged in.`, 
                        embeds: [],
                        components: [
                            {
                                type: 1,
                                components: [
                                    {
                                        type: 2,
                                        style: 5,
                                        label: "Login",
                                        disabled: false,
                                        url: this.modules.OsuAuthService.getAuthorizationURL(
                                            state,
                                            ["public", "identify"]
                                        ),
                                    },
                                ],
                            },
                        ],
                    });
                }
            } catch (err) {
                console.log(err);
                await interaction.editReply(
                    "Invalid or missing permission on Spreadsheet.\n-# Please add `sheets-editor@tix-eroge-project.iam.gserviceaccount.com` as editor on your Spreadsheet."
                );
            }
        } else if (action === "unregister") {
             try {
                const count =
                    await this.modules.SpreadsheetService.removeRegistrationByDiscordId(
                        spreadsheet_id,
                        sheet_name,
                        interaction.user.id
                    );
                if (count && count > 0) {
                    await interaction.editReply(
                        "Successfully unregistered!"
                    );
                } else {
                    await interaction.editReply(
                        "You weren't even registered in the first place."
                    );
                }
            } catch {
                await interaction.editReply(
                    "Failed to process, please ask the Server Admins."
                );
            }
        } else if (action === "logout") {
             await this.modules.DatabaseService.deleteOsuByDiscord(
                interaction.user.id
             );
             await interaction.editReply(
                "Successfully logged out from this bot.\n-# Note that logout doesn't remove you from the tournament if you ever registered."
             );
        } else if (action === "join") {
             await this.onJoin(interaction, spreadsheet_id, sheet_name, message_id);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private register(modules: CommandModules) {
        this.client.on("interactionCreate", async (interaction) => {
            if (interaction.isChatInputCommand()) {
                const { commandName, options } = interaction;
                const subCommand = options.getSubcommand(true);

                if (commandName !== "create") {
                    return;
                }
                if (subCommand === "register") {
                    const spreadsheetId: string = options.getString("spreadsheetid", true);
                    const sheetName =
                        options.getString("sheetname", false) ??
                        "Miu Bot Registrants";
                    const content: string =
                        options.getString("content", false) ??
                        "osu! Tournament Interactive Menu";
                    const allowUnregister: boolean =
                        options.getBoolean("allowunregister", false) ?? true;
                    const string_flags: string =
                        options.getString('flags', false) ?? "";

                    // custom flags
                    const flags = {};
                    if (string_flags.toLowerCase().match('4wc_2025')) {
                        if (!(interaction.guildId === '561377825639235594' || interaction.guildId === '683598850614624260')) { // 4wc Server or Tix Placeholder Server
                            return await interaction.reply({
                                content: "Flag is unavailable in this server.",
                                flags: [MessageFlags.Ephemeral],
                            });
                        }
                        flags['4wc_2025'] = true;
                    }

                    // components related
                    await interaction.deferReply({
                        flags: [MessageFlags.Ephemeral],
                    });
                    try {
                        const chat = await interaction.channel.send({
                            content,
                            tts: false,
                            embeds: [],
                            components: [
                                {
                                    type: 1,
                                    components: [
                                        {
                                            custom_id: "register",
                                            type: 2,
                                            style: 1,
                                            label: "REGISTER",
                                            emoji: {
                                                name: "🎟️",
                                                animated: false,
                                            },
                                        },
                                        {
                                            custom_id: "unregister",
                                            type: 2,
                                            style: 4,
                                            label: "UNREGISTER",
                                            disabled: !allowUnregister,
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
                            {flags},
                        );

                        interaction.editReply({
                            content: "Success!",
                        });
                    } catch {
                        interaction.editReply({
                            content: "Unable to send message in this channel.",
                        });
                    }
                }
            } else if (interaction.isButton()) {
                await this.onButtonInteraction(interaction);
            }
        });
    }

    public async onBotReady() {
        const chats =
            await this.modules.DatabaseService.getAllChatSpreadsheet();

        for (const partial_data of chats) {
            const channel = this.client.channels.cache.get(
                partial_data.channel_id
            );
            if (!channel?.isTextBased()) continue;

            try {
                await channel.messages.fetch(partial_data.message_id);
            } catch {
                await this.modules.DatabaseService.deleteChatSpreadsheet(
                    partial_data.message_id
                );
            }
            
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
    }

    public getCommand() {
        return {
            name: "create",
            description: "Create Core Command",
            options: [
                {
                    type: 1,
                    name: "register",
                    description:
                        "Creates the register button for osu players in this channel.",
                    options: [
                        {
                            type: 3,
                            name: "spreadsheetid",
                            description: "Target spreadsheet Id",
                            required: true,
                            choices: [],
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
                            description: "The text for interactive menu.",
                        },
                        {
                            type: 5,
                            name: "allowunregister",
                            description: "Defaults to true",
                        },
                        {
                            type: 3,
                            name: "flags",
                            description: "Custom flags",
                        },
                    ],
                },
            ],
            default_member_permissions: `${PermissionFlagsBits.ManageChannels}`,
            contexts: [InteractionContextType.Guild],
        };
    }
}