import { Injectable } from '@nestjs/common';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Client, GatewayIntentBits, REST, Routes, Events, User as DiscordUser, PermissionFlagsBits, Guild, PermissionsBitField, TextChannel, MessagePayload, MessageCreateOptions } from 'discord.js';

import { ConfigService } from '@nestjs/config';
import Configuration from 'src/config';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const local_config = Configuration();

@Injectable()
export class DiscordService {

}
