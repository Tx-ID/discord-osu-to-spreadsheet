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
    public static enabled: boolean = false;

    constructor(
        private client: Client,
        private modules: CommandModules
    ) {
        this.register(modules);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private register(modules: CommandModules) {
        this.client.on("interactionCreate", async (interaction) => {
            if (!interaction.isChatInputCommand()) return;

            const { commandName, options } = interaction;
            const subCommand = options.getSubcommand(true);

            if (commandName !== "refresh") {
                return;
            }
            if (subCommand === "sheet") {
                const spreadsheetId = options.getString("spreadsheetid", true);
                const sheetName =
                    options.getString("sheetname", false) ??
                    "Miu Bot Registrants";

                await interaction.deferReply({
                    flags: [MessageFlags.Ephemeral],
                });

                try {

                } catch {}
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
                    name: "sheet",
                    description: "Refresh osu! usernames and ranks",
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
            ],
            default_member_permissions: `${PermissionFlagsBits.ManageChannels}`,
            contexts: [InteractionContextType.Guild],
        };
    }
}
