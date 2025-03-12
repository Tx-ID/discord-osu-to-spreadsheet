/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from "@nestjs/common";
import { Client, ComponentType, Message, MessageFlags } from "discord.js";
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

    private async onRegisterMessageCreated(
        message: Message<true>,
        spreadsheet_id: string,
        sheet_name: string
    ) {
        const collector = await message.createMessageComponentCollector();
        collector.on("collect", async (button_interaction) => {
            if (!button_interaction.isButton()) return;

            const button_id = button_interaction.customId;
            await button_interaction.deferReply({
                flags: [MessageFlags.Ephemeral],
            });

            if (button_id === "register") {
                const sheet =
                    await this.modules.SpreadsheetService.get(spreadsheet_id);
                if (!sheet) {
                    return await button_interaction.editReply(
                        "Invalid or missing permission to read Sheets."
                    );
                }
                const has_sheet = await sheet.createSheetOrTab(sheet_name);

                if (!has_sheet)
                    return await button_interaction.editReply(
                        "Failed to interact with Sheet."
                    );

                await button_interaction.editReply("Success!");
            } else if (button_id === "unregister") {
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
                const spreadsheetId = options.getString("spreadsheetid", true);
                const sheetName =
                    options.getString("sheetname", false) ??
                    "Miu Bot Registrants";
                const content =
                    options.getString("content", false) ??
                    "osu! Tournament Interactive Menu";

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
                        sheetName
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
                    ],
                },
            ],
        };
    }
}
