import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Osu, OsuDocument } from './schemas/osu.schema';
import { ChatToSpreadsheet, ChatToSpreadsheetDocument } from './schemas/chat-to-spreadsheet.schema';

@Injectable()
export class DatabaseService {
    constructor(
        @InjectModel(Osu.name) private osuModel: Model<OsuDocument>,
        @InjectModel(ChatToSpreadsheet.name) private chatToSpreadsheetModel: Model<ChatToSpreadsheetDocument>,
    ) {}

    //
    async getChatSpreadsheet(message_id: string) {
        return await this.chatToSpreadsheetModel.findOne({ message_id }).exec();
    }

    async setChatSpreadsheet(
        message_id: string,
        channel_id: string,
        spreadsheet_id: string,
        sheet_name?: string,
        other_data?: any,
    ) {
        return await this.chatToSpreadsheetModel.findOneAndUpdate(
            { message_id },
            { channel_id, spreadsheet_id, sheet_name, other_data },
            { upsert: true, new: true },
        ).exec();
    }

    async getAllChatSpreadsheet() {
        return await this.chatToSpreadsheetModel.find({}, 'message_id channel_id').exec();
    }

    async deleteChatSpreadsheet(message_id: string) {
        return await this.chatToSpreadsheetModel.deleteOne({ message_id }).exec();
    }

    //
    async getOsuByDiscord(id: string) {
        return await this.osuModel.findOne({ discordId: id }).exec();
    }

    async setOsuByDiscord(discordId: string, osuId: string, username: string, restricted: boolean) {
        return await this.osuModel.findOneAndUpdate(
            { discordId },
            { osuId, osuUsername: username, is_restricted: restricted },
            { upsert: true, new: true },
        ).exec();
    }

    async deleteOsuByDiscord(id: string) {
        return await this.osuModel.deleteOne({ discordId: id }).exec();
    }
}
