import { ConfigService } from "@nestjs/config";
import { DiscordService } from "src/discord/discord.service";
import { OsuService } from "src/osu/osu.service";

export type CommandModules = {

    DiscordService: DiscordService,
    OsuService: OsuService,
    ConfigService: ConfigService,

};