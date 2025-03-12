import { Injectable } from '@nestjs/common';
import { Client, Interaction } from 'discord.js';
import { CommandModules } from '../modules.type';

@Injectable()
export class PingCommand {
    public static enabled: boolean = true;

    constructor(private client: Client, modules: CommandModules) {
        this.register(modules);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private register(modules: CommandModules) {
        this.client.on('interactionCreate', async (interaction: Interaction) => {
            if (!interaction.isCommand()) return;

            const { commandName } = interaction;
            if (commandName === 'ping') {
                try {
                    await interaction.reply('Pong!');
                } catch {}
            }
        });
    }

    public async onBotReady() {

    }

    public getCommand() {
        return {
            name: 'ping',
            description: 'Replies with Pong!',
        };
    }
};
