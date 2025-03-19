import { Injectable } from "@nestjs/common";

import { ConfigService } from "@nestjs/config";
import Configuration from "src/config";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const local_config = Configuration();

import { Auth, Client } from "osu-web.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as osu from "osu-web.js";

//
function splitArrayIntoChunks<T>(array: T[], chunkSize: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        const chunk = array.slice(i, i + chunkSize);
        result.push(chunk);
    }
    return result;
}

//
@Injectable()
export class OsuService {
    private base_url: string;
    private config: typeof local_config.osu;

    private auth: Auth;
    private guestClient: Client;

    constructor(_: ConfigService) {
        this.base_url = _.get("base_url");
        this.config = _.get<typeof local_config.osu>("osu");

        this.load();
    }

    async load() {
        this.auth = new Auth(
            this.config.client_id,
            this.config.client_secret,
            `${this.base_url}${this.config.callback_url}`
        );
    }

    async getAccessToken(code: string) {
        try {
            const grant = this.auth.authorizationCodeGrant([
                "public",
                "identify",
            ]);
            return await grant.requestToken(code);
        } catch {}
    }

    async getGuestClient() {
        let refresh = false;

        const currentClient = this.guestClient;
        if (!currentClient) refresh = true;
        else {
            try {
                await currentClient.users.getUser(11421465);
            } catch {
                refresh = true;
            }
        }

        if (refresh) {
            const new_token = await this.auth.clientCredentialsGrant([
                "public",
            ]);
            this.guestClient = new Client(new_token.access_token);
        }

        return this.guestClient;
    }

    async getSelf(access_token: string) {
        try {
            const client = new Client(access_token);
            return await client.users.getSelf();
        } catch {}
    }

    async getUser(userId) {
        try {
            const client = await this.getGuestClient();
            return await client.users.getUser(userId);
        } catch (err) {
            console.log(err);
        }
    }

    async getMultipleUsers(ids: string[]) {
        const chunks = splitArrayIntoChunks(ids, 50);
        const users: (osu.UserCompact & {
            country: osu.Country;
            cover: osu.Cover;
            groups: osu.UserGroup[];
            statistics_rulesets: osu.StatisticsRulesets;
        })[] = [];

        try {
            const client = await this.getGuestClient();

            for (const chunk of chunks) {
                try {
                    const data = await client.users.getUsers({
                        query: {
                            ids: chunk.map((id) => Number(id)),
                            include_variant_statistics: true,
                        },
                    });
                    data.forEach((user) => users.push(user));
                } catch {}
            }
        } catch {}

        return users;
    }
}
