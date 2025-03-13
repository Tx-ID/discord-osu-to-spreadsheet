import { Injectable } from "@nestjs/common";

import { ConfigService } from "@nestjs/config";
import Configuration from "src/config";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const local_config = Configuration();

import { buildUrl } from "osu-web.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as osu from "osu-web.js";

import { encrypt, decrypt } from '../utilities/crypto.utility';
import { OsuService } from "src/osu/osu.service";

@Injectable()
export class OsuProviderService {
    private base_url: string;
    private config: typeof local_config.osu;

    constructor(_: ConfigService, private osu: OsuService) {
        this.base_url = _.get("base_url");
        this.config = _.get<typeof local_config.osu>("osu");

        this.load();
    }

    async load() {
        // console.log(this.getAuthorizationURL("TEST SRING FUNNEH", ['public']));
    }

    getAuthorizationURL(state: string, scope: osu.Scope[]) {
        const url = buildUrl.authRequest(
            this.config.client_id,
            `${this.base_url}${this.config.callback_url}`,
            [encodeURI((scope ?? ['public']).join(" ")) as any], // ???
            encodeURI(state)
        );
        return url;
    }

    generateState(guildId: string, discordUserId: string) {
        try {
            return encrypt({guildId, useless4: Math.random(), discordUserId, useless2: Math.random(), 3: Math.random()});
        } catch {}
    }

    readState(state: string): Promise<{guildId: string, discordUserId: string} | undefined> {
        try {
            return decrypt(state);
        } catch {}
    }
};
