import { Module } from '@nestjs/common';
import { DiscordBotService } from './discord-bot.service';

import { DiscordModule } from 'src/discord/discord.module';
import { OsuModule } from 'src/osu/osu.module';
import { DatabaseModule } from 'src/database/database.module';
import { SpreadsheetModule } from 'src/spreadsheet/spreadsheet.module';

@Module({
  imports: [DiscordModule, OsuModule, DatabaseModule, SpreadsheetModule],
  providers: [DiscordBotService],
})
export class DiscordBotModule {}
