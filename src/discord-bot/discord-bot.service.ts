import { Injectable, OnModuleInit } from '@nestjs/common';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Client, GatewayIntentBits, REST, Routes, Events, User as DiscordUser, PermissionFlagsBits, Guild, PermissionsBitField, TextChannel, MessagePayload, MessageCreateOptions } from 'discord.js';
import { OAuth2API } from '@discordjs/core';
import * as Commands from './commands';

import { ConfigService } from '@nestjs/config';
import Configuration from 'src/config';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const local_config = Configuration();

import { DiscordService } from 'src/discord/discord.service';
import { OsuService } from 'src/osu/osu.service';
import { DatabaseService } from 'src/database/database.service';
import { SpreadsheetService } from 'src/spreadsheet/spreadsheet.service';
import { OsuProviderService } from 'src/osu-provider/osu-provider.service';


@Injectable()
export class DiscordBotService implements OnModuleInit {
    private config: typeof local_config.discord;

    private client: Client<boolean>;
    private rest: REST;
    private oauth2: OAuth2API;

    private readonly commands = [];

    constructor(
        private _: ConfigService,

        private discord: DiscordService,
        private osu: OsuService,
        private database: DatabaseService,
        private spreadsheet: SpreadsheetService,

        private osu_provider: OsuProviderService,
    ) {
        this.config = _.get<typeof local_config.discord >('discord');

        this.rest = new REST({ version: '10' }).setToken(this.config.token);
        this.oauth2 = new OAuth2API(this.rest);

        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                // GatewayIntentBits.GuildMembers,
            ],
        });

        for (const CommandClass of Object.values(Commands)) {
            if (!CommandClass.enabled) continue;
            const commandInstance = new CommandClass(this.client, {
                OsuService: osu,
                DiscordService: discord,
                ConfigService: _,
                DatabaseService: database,
                SpreadsheetService: spreadsheet,
                OsuAuthService: osu_provider,
            });
            this.commands.push(commandInstance.getCommand());

            this.client.once(Events.ClientReady, async () => {
                commandInstance.onBotReady().then(() => {}).catch(() => {});
            });
        }
    }

    //
    async onModuleInit() {
        this.client.once(Events.ClientReady, async () => {
            try {
                await this.rest.put(
                    Routes.applicationCommands(this.config.application_id),
                    { body: this.commands },
                );
                console.log(`PUT ${this.commands.length} slash commands!`);
            } catch (error) {
                console.error(error);
            }

            console.log(`Logged in as ${this.client.user.tag}`);
        });

        await this.client.login(this.config.token);
    }
}
