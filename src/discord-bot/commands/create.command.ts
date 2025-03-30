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
        interaction: Interaction, // DEFERRED REPLY
        spreadsheet_id: string,
        sheet_name: string,
        message: Message<true>
    ) {
        if (!interaction.isButton()) return;

        try {
            const chat_data = await this.modules.DatabaseService.getChatSpreadsheet(message.id);
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
                for (const n of rows) {
                    const names = n[0];
                    const list = names.split(',  ').map(n => this.sanitizeString(n));
                    if (list.includes(user.osuUsername)){
                        found = true;
                        break;
                    }
                }
                if (!found)
                    return await interaction.editReply(
                        '[Please register elsewhere first by clicking this text.](<https://r.shdewz.me/4wc25-registration>)\n-# Please wait a moment before pressing join button again after registering.'
                    );
            }

            const get_user_id =
                await this.modules.SpreadsheetService.checkDiscordIdExistInRegistration(
                    spreadsheet_id,
                    sheet_name,
                    user.discordId
                );
            if (!get_user_id) {
                await this.modules.SpreadsheetService.appendSheetForOsuRegistration(
                    spreadsheet_id,
                    sheet_name,
                    user.discordId,
                    interaction.user.username,
                    user.osuId,
                    user.osuUsername
                );
                await interaction.editReply("Success!");
            } else {
                const profile =
                    await this.modules.OsuService.getUser(get_user_id);
                await interaction.editReply(
                    `You already registered as **${profile.username}**. Press the unregister button if you want to unregister yourself.`
                );
            }
        } catch (err) {
            console.log(err);
            await interaction.editReply(
                "Failed during process. It's not your fault!"
            );
        }
    }

    private async onRegisterMessageCreated(
        message: Message<true>,
        spreadsheet_id: string,
        sheet_name: string
    ) {
        const collector = await message.createMessageComponentCollector();
        collector.on("collect", async (button_interaction) => {
            if (!button_interaction.isButton()) return;
            if (button_interaction.component.disabled) return;

            const chat_data = await this.modules.DatabaseService.getChatSpreadsheet(message.id);
            if (!chat_data) {
                return await button_interaction.reply({
                    content: "Registration is no longer valid. It's not your fault!",
                    flags: [MessageFlags.Ephemeral],
                });
            }

            const button_id = button_interaction.customId;
            await button_interaction.deferReply({
                flags: [MessageFlags.Ephemeral],
            });

            if (button_id === "register") {
                try {
                    const state = this.modules.OsuAuthService.generateState(
                        button_interaction.guildId,
                        button_interaction.user.id
                    );

                    const user =
                        await this.modules.DatabaseService.getOsuByDiscord(
                            button_interaction.user.id
                        );
                    if (user) {
                        const profile = await this.modules.OsuService.getUser(
                            user.osuId
                        );

                        const chat = await button_interaction.editReply({
                            content: `You are logged in as [**${profile.username}**](<https://osu.ppy.sh/users/${user.osuId}>) in osu!`,
                            embeds: [],
                            components: [
                                {
                                    type: 1,
                                    components: [
                                        {
                                            custom_id: "join",
                                            type: 2,
                                            style: 3,
                                            label: "Join Tournament",
                                            emoji: {
                                                name: "🎟️",
                                                animated: false,
                                            },
                                        },
                                        // {
                                        //     type: 2,
                                        //     style: 5,
                                        //     label: "Change Account",
                                        //     disabled: false,
                                        //     url: this.modules.OsuAuthService.getAuthorizationURL(
                                        //         state, ['public', 'identify']
                                        //     ),
                                        // },
                                        {
                                            custom_id: "logout",
                                            type: 2,
                                            style: 4,
                                            label: "Logout",
                                            emoji: {
                                                name: "👋",
                                                animated: false,
                                            },
                                        },
                                    ],
                                },
                            ],
                        });

                        const collector =
                            chat.createMessageComponentCollector();
                        collector.on("collect", async (another_interaction) => {
                            if (!another_interaction.isButton()) return;

                            await another_interaction.deferReply({
                                flags: [MessageFlags.Ephemeral],
                            });

                            const button_id = another_interaction.customId;
                            if (button_id === "logout") {
                                await this.modules.DatabaseService.deleteOsuByDiscord(
                                    another_interaction.user.id
                                );
                                await another_interaction.editReply(
                                    "Successfully logged out from this bot.\n*Note that logout doesn't remove you from the tournamentif you ever registered.*"
                                );
                            } else if (button_id === "join") {
                                await this.onJoin(
                                    another_interaction,
                                    spreadsheet_id,
                                    sheet_name,
                                    message,
                                );
                            }
                        });
                        return;
                    } else {
                        return await button_interaction.editReply({
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
                    return await button_interaction.editReply(
                        "Invalid or missing permission on Spreadsheet.\n-# Please add `sheets-editor@tix-eroge-project.iam.gserviceaccount.com` as editor on your Spreadsheet."
                    );
                }

                // await button_interaction.editReply("Success!");
            } else if (button_id === "unregister") {
                try {
                    const count =
                        await this.modules.SpreadsheetService.removeRegistrationByDiscordId(
                            spreadsheet_id,
                            sheet_name,
                            button_interaction.user.id
                        );
                    if (count && count > 0) {
                        await button_interaction.editReply(
                            "Successfully unregistered!"
                        );
                    } else {
                        await button_interaction.editReply(
                            "You weren't even registered in the first place."
                        );
                    }
                } catch {
                    return await button_interaction.editReply(
                        "Failed to process, please ask the Server Admins."
                    );
                }
            }
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private register(modules: CommandModules) {
        this.client.on("interactionCreate", async (interaction) => {
            if (!interaction.isChatInputCommand()) return;

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

                    this.onRegisterMessageCreated(
                        chat,
                        spreadsheetId,
                        sheetName
                    );

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
        });
    }

    public async onBotReady() {
        const chats =
            await this.modules.DatabaseService.getAllChatSpreadsheet();

        for (const partial_data of chats) {
            const data = await this.modules.DatabaseService.getChatSpreadsheet(
                partial_data.message_id
            );
            const channel = this.client.channels.cache.get(
                partial_data.channel_id
            );
            if (!channel.isTextBased()) continue;

            const message = await channel.messages.fetch(
                partial_data.message_id
            );

            if (!message) {
                await this.modules.DatabaseService.deleteChatSpreadsheet(
                    partial_data.message_id
                );
            } else if (message.inGuild()) {
                this.onRegisterMessageCreated(
                    message,
                    data.spreadsheet_id,
                    data.sheet_name
                );
            }
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
