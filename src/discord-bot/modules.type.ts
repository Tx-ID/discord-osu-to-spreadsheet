import { ConfigService } from "@nestjs/config";
import { DatabaseService } from "src/database/database.service";
import { DiscordService } from "src/discord/discord.service";
import { OsuProviderService } from "src/osu-provider/osu-provider.service";
import { OsuService } from "src/osu/osu.service";
import { SpreadsheetService } from "src/spreadsheet/spreadsheet.service";

export type CommandModules = {

    DiscordService: DiscordService,
    OsuService: OsuService,
    OsuAuthService: OsuProviderService,
    ConfigService: ConfigService,
    DatabaseService: DatabaseService,
    SpreadsheetService: SpreadsheetService,

};