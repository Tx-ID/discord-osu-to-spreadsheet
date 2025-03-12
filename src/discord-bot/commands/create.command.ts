import { Injectable } from "@nestjs/common";
import { Client, MessageFlags } from "discord.js";
import { CommandModules } from "../modules.type";

@Injectable()
export class CreateCommand {
    public static enabled: boolean = true;

    constructor(
        private client: Client,
        modules: CommandModules
    ) {
        this.register(modules);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private register(modules: CommandModules) {
        this.client.on(
            "interactionCreate",
            async (interaction) => {
                if (!interaction.isChatInputCommand()) return;

                const { commandName, options } = interaction;
                const subCommand = options.getSubcommand(true);

                if (commandName !== "create") {
                    return;
                }
                if (subCommand === "register") {
                    interaction.reply({
                        content: "I see you!",
                        flags: [MessageFlags.Ephemeral],
                    });
                }
            }
        );
    }

    public async onBotReady() {}

    public getCommand() {
        return {
            name: "create",
            description: "Create Core Command",
            options: [
                {
                    type: 1,
                    name: "register",
                    description: "Creates the register button for osu players.",
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
                    ],
                },
            ],
        };
    }
}
