import { JsonDB, Config } from 'node-json-db';
export default class OsuDB {
    private db: JsonDB;

    constructor() {
        const autosave = true;
        const minifyJSON = true;
        const separator = "/";

        const config = new Config('./db/OsuDB', autosave, !minifyJSON, separator);
        this.db = new JsonDB(config);
    }

    async findById(discordId) {
        return await this.db.getObjectDefault<{
            discordId,
            osuId,
            osuUsername: string,
            is_restricted: boolean,
        }>(`/${discordId}`);
    }

    async set(discordId, osuId, username: string, restricted: boolean) {
        return await this.db.push(`/${discordId}`, {
            discordId,
            osuId,
            osuUsername: username,
            is_restricted: restricted,
        });
    }

    async delete(discordId) {
        await this.db.delete(`/${discordId}`);
    }
};
