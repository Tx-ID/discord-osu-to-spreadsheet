import { Module } from '@nestjs/common';
import { DiscordBotService } from './discord-bot.service';

import { DiscordModule } from 'src/discord/discord.module';
import { OsuModule } from 'src/osu/osu.module';

@Module({
  imports: [DiscordModule, OsuModule],
  providers: [DiscordBotService],
})
export class DiscordBotModule {}
