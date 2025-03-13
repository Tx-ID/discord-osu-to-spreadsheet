// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BadRequestException, Controller, Get, InternalServerErrorException, Param, Query } from "@nestjs/common";

import { OsuService } from "src/osu/osu.service";
import { OsuProviderService } from "./osu-provider.service";
import { DatabaseService } from "src/database/database.service";

@Controller("")
export class OsuProviderController {
    constructor(
        private osu: OsuService,
        private provider: OsuProviderService,

        private database: DatabaseService,
    ) {}

    @Get("/osu-callback")
    async osu_callback(@Query() params: { code: string; state: string }) {
        if (!params) throw new BadRequestException('');
        if (!params.code) throw new BadRequestException("?");

        const state = params.state;
        const state_data = await this.provider.readState(state ?? "");
        if (!state_data) throw new BadRequestException("??");

        const access_response = await this.osu.getAccessToken(params.code);
        if (!access_response) throw new InternalServerErrorException('');

        const self = await this.osu.getSelf(access_response.access_token);
        if (!self) throw new InternalServerErrorException("?");

        try {
            await this.database.setOsuByDiscord(state_data.discordUserId, self.id, self.username, self.is_restricted);
        } catch {
            throw new InternalServerErrorException('??');
        }

        return "Successfully logged in, now go back and press register again.";
    }
}
