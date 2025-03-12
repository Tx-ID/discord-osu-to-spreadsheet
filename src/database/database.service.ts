import { Injectable } from "@nestjs/common";

import ChatToSpreadsheet from "./dbs/chatToSpreadsheet.db";

@Injectable()
export class DatabaseService {
    private ChatToSpreadsheet: ChatToSpreadsheet;

    constructor() {
        this.ChatToSpreadsheet = new ChatToSpreadsheet();
    }

    //
    async getChatSpreadsheet(message_id) {
        return await this.ChatToSpreadsheet.getFromChat(message_id);
    }

    async setChatSpreadsheet(
        message_id,
        channel_id,
        spreadsheet_id: string,
        sheet_name?: string
    ) {
        return await this.ChatToSpreadsheet.setToChat(
            message_id,
            channel_id,
            spreadsheet_id,
            sheet_name
        );
    }

    async getAllChatSpreadsheet() {
        return await this.ChatToSpreadsheet.getAllChats();
    }

    async deleteChatSpreadsheet(message_id) {
        return await this.ChatToSpreadsheet.deleteChat(message_id)
    }

    //
}
