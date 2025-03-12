import { JsonDB, Config } from 'node-json-db';
export default class ChatToSpreadsheet {
    private db: JsonDB;

    constructor() {
        const autosave = true;
        const minifyJSON = true;
        const separator = "/";

        const config = new Config('./db/ChatToSpreadsheet', autosave, !minifyJSON, separator);
        this.db = new JsonDB(config);
    }

    async getFromChat(message_id) {
        return await this.db.getObjectDefault<{spreadsheet_id: string, sheet_name: string, channel_id, updated_at: Date}>(`/${message_id}`, null);
    }

    async setToChat(message_id, channel_id, spreadsheet_id: string, sheet_name?: string) {
        await this.db.push(`/${message_id}`, {
            spreadsheet_id,
            sheet_name,
            channel_id,
            updated_at: new Date(),
        });
    }

    async getAllChats() {
        const dict: object = await this.db.getData('/');
        return Object.entries(dict).map(([message_id, data]) => {
            return {
                message_id,
                channel_id: data.channel_id as string,
            };
        });
    }

    async deleteChat(message_id) {
        await this.db.delete(`/${message_id}`);
    }
};
