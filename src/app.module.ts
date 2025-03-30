import { Module } from "@nestjs/common";
import { ConfigModule } from '@nestjs/config';
import 'dotenv/config';

import { OsuProviderModule } from './osu-provider/osu-provider.module';
import { DiscordBotModule } from './discord-bot/discord-bot.module';
import { DiscordModule } from './discord/discord.module';
import { OsuModule } from './osu/osu.module';
import { DatabaseModule } from './database/database.module';
import { SpreadsheetModule } from './spreadsheet/spreadsheet.module';

import Configuration from './config';

@Module({
    imports: [
        ConfigModule.forRoot({isGlobal: true, load: [Configuration],}),
        OsuProviderModule,
        OsuModule,
        DiscordBotModule,
        DiscordModule,
        DatabaseModule,
        SpreadsheetModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {};
