import { Injectable } from "@nestjs/common";

import { ConfigService } from "@nestjs/config";
import Configuration from "src/config";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const local_config = Configuration();

import { Auth, Client } from "osu-web.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as osu from "osu-web.js";

function splitArrayIntoChunks<T>(array: T[], chunkSize: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        const chunk = array.slice(i, i + chunkSize);
        result.push(chunk);
    }
    return result;
}

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

    private async executeWithRetry<T>(
        operation: () => Promise<T>,
        retries: number = 3,
        baseDelay: number = 1000
    ): Promise<T> {
        let lastError: any;
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                if (attempt < retries - 1) {
                    const delay = baseDelay * Math.pow(2, attempt);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError;
    }

    async getAccessToken(code: string) {
        try {
            const grant = this.auth.authorizationCodeGrant([
                "public",
                "identify",
            ]);
            return await this.executeWithRetry(() => grant.requestToken(code));
        } catch {}
    }

    private tokenExpiresAt: number = 0;

    async getGuestClient() {
        if (this.guestClient && Date.now() < this.tokenExpiresAt) {
            return this.guestClient;
        }

        const new_token = await this.executeWithRetry(() => this.auth.clientCredentialsGrant([
            "public",
        ]));
        this.guestClient = new Client(new_token.access_token);
        
        // Use expires_in from token if available, otherwise default to 1 hour. 
        // Subtract 60s buffer.
        const expiresIn = (new_token as any).expires_in ?? 3600;
        this.tokenExpiresAt = Date.now() + (expiresIn * 1000) - 60000;

        return this.guestClient;
    }

    async getSelf(access_token: string) {
        try {
            const client = new Client(access_token);
            return await this.executeWithRetry(() => client.users.getSelf());
        } catch {}
    }

    async getUser(userId) {
        try {
            const client = await this.getGuestClient();
            return await this.executeWithRetry(() => client.users.getUser(userId));
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
            badges?: osu.UserBadge[];
        })[] = [];

        try {
            const client = await this.getGuestClient();

            for (const chunk of chunks) {
                try {
                    const data = await this.executeWithRetry(() => client.users.getUsers({
                        query: {
                            ids: chunk.map((id) => Number(id)),
                            include_variant_statistics: true,
                        },
                    }));

                    for (const user of data) {
                        if (!user.badges) {
                            try {
                                await new Promise((resolve) => setTimeout(resolve, 50));
                                const fullUser = await this.executeWithRetry(() => client.users.getUser(user.id));
                                (user as any).badges = fullUser.badges;
                            } catch {}
                        }
                        users.push(user);
                    }
                } catch {}
            }
        } catch {}

        return users;
    }
}
