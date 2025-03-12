import { Module } from "@nestjs/common";
import { ConfigModule } from '@nestjs/config';

import { OsuProviderModule } from './osu-provider/osu-provider.module';
import { DiscordBotModule } from './discord-bot/discord-bot.module';
import { DiscordModule } from './discord/discord.module';
import { OsuModule } from './osu/osu.module';

import Configuration from './config';

@Module({
    imports: [
        ConfigModule.forRoot({isGlobal: true, load: [Configuration],}),
        OsuProviderModule,
        DiscordBotModule,
        DiscordModule,
        OsuModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {};
