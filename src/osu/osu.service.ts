import { Injectable } from "@nestjs/common";

import { ConfigService } from "@nestjs/config";
import Configuration from "src/config";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const local_config = Configuration();

import { Auth, Client } from "osu-web.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as osu from "osu-web.js";

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
            const grant = this.auth.authorizationCodeGrant(['public', 'identify']);
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
        } catch(err) {
            console.log(err);
        }
    }
}
