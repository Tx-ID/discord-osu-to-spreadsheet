// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BadRequestException, Controller, Get, InternalServerErrorException, Param, Query } from "@nestjs/common";

import { OsuService } from "src/osu/osu.service";
import { OsuProviderService } from "./osu-provider.service";
import { DatabaseService } from "src/database/database.service";
import { renderTextHtml } from "./osu-html-templates";

@Controller("")
export class OsuProviderController {
    constructor(
        private osu: OsuService,
        private provider: OsuProviderService,

        private database: DatabaseService,
    ) {}

    @Get("/osu-callback")
    async osu_callback(@Query() params: { code: string; state: string }) {
        try {
            if (!params || !params.code) throw new Error("1");

            const state = params.state;
            const state_data = await this.provider.readState(state ?? "");
            if (!state_data) throw new Error("2");

            const access_response = await this.osu.getAccessToken(params.code);
            if (!access_response) throw new Error("3");

            const expires_in_seconds = access_response.expires_in ?? 0;

            const self = await this.osu.getSelf(access_response.access_token);
            if (!self) throw new Error("4");

            await this.database.setOsuByDiscord(
                state_data.discordUserId,
                String(self.id),
                self.username,
                self.is_restricted,
                expires_in_seconds
            );

            return renderTextHtml(`Logged in as ${self.username}. You can now close this window and return to Discord.`);
        } catch (e) {
            let error_text = "";
            if (e instanceof Error) {
                error_text = ` [${e.message}]`;
            }
            return renderTextHtml(`An unknown error occurred ${error_text}`);
        }
    }
}
