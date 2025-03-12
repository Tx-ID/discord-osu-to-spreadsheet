import { Injectable, OnModuleInit } from '@nestjs/common';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Client, GatewayIntentBits, REST, Routes, Events, User as DiscordUser, PermissionFlagsBits, Guild, PermissionsBitField, TextChannel, MessagePayload, MessageCreateOptions } from 'discord.js';
import { OAuth2API } from '@discordjs/core';
import * as Commands from './commands';

import { ConfigService } from '@nestjs/config';
import Configuration from 'src/config';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const local_config = Configuration();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { encrypt, decrypt } from '../utilities/crypto.utility';
import { DiscordService } from 'src/discord/discord.service';
import { OsuService } from 'src/osu/osu.service';


@Injectable()
export class DiscordBotService implements OnModuleInit {
    private config;

    private client;
    private rest;
    private oauth2;

    private readonly commands = [];

    constructor(
        _: ConfigService,

        discord: DiscordService,
        osu: OsuService,
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
