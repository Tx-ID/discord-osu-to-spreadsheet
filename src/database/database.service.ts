import { Injectable } from "@nestjs/common";

import ChatToSpreadsheet from "./dbs/chatToSpreadsheet.db";
import OsuDB from "./dbs/osu.db";

@Injectable()
export class DatabaseService {
    private ChatToSpreadsheet: ChatToSpreadsheet;
    private OsuDB: OsuDB;

    constructor() {
        this.ChatToSpreadsheet = new ChatToSpreadsheet();
        this.OsuDB = new OsuDB();
    }

    //
    async getChatSpreadsheet(message_id) {
        return await this.ChatToSpreadsheet.getFromChat(message_id);
    }

    async setChatSpreadsheet(
        message_id,
        channel_id,
        spreadsheet_id: string,
        sheet_name?: string,
        other_data?: any,
    ) {
        return await this.ChatToSpreadsheet.setToChat(
            message_id,
            channel_id,
            spreadsheet_id,
            sheet_name,
            other_data
        );
    }

    async getAllChatSpreadsheet() {
        return await this.ChatToSpreadsheet.getAllChats();
    }

    async deleteChatSpreadsheet(message_id) {
        return await this.ChatToSpreadsheet.deleteChat(message_id)
    }

    //
    async getOsuByDiscord(id) {
        return await this.OsuDB.findById(id);
    }

    async setOsuByDiscord(discordId, osuId, username: string, restricted: boolean) {
        return await this.OsuDB.set(discordId, osuId, username, restricted);
    }

    async deleteOsuByDiscord(id) {
        return await this.OsuDB.delete(id);
    }
}
