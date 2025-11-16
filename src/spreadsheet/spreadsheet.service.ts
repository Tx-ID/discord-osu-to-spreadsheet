import { Injectable } from "@nestjs/common";

import { ConfigService } from "@nestjs/config";
import Configuration from "src/config";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const local_config = Configuration();

import GoogleSpreadsheet from "src/utilities/spreadsheet.utility";

@Injectable()
export class SpreadsheetService {
    private config: typeof local_config.sheets;
    private sheets: Map<string, GoogleSpreadsheet>;

    constructor(_: ConfigService) {
        this.config = _.get<typeof local_config.sheets>("sheets");
        this.sheets = new Map();
    }

    async get(spreadsheet_id: string): Promise<GoogleSpreadsheet | undefined> {
        const sheet = this.sheets.get(spreadsheet_id);
        if (sheet) return sheet;

        const new_sheet = new GoogleSpreadsheet({
            clientEmail: this.config.email,
            privateKey: this.config.key,
            spreadsheetId: spreadsheet_id,
            keyId: this.config.key_id,
        });

        const valid = await new_sheet.getSheetMetadata();
        if (valid) {
            this.sheets.set(spreadsheet_id, new_sheet);
            return new_sheet;
        }
    }

    async getForOsuRegistration(
        spreadsheet_id: string,
        sheet_name: string
    ): Promise<GoogleSpreadsheet> {
        const sheet = await this.get(spreadsheet_id);
        if (!sheet) throw new Error("Failed to read spreadsheet.\n-# For moderators, please add this email to the targetted spreadsheet: sheets-editor@tix-eroge-project.iam.gserviceaccount.com");

        const has_sheet = await sheet.createSheetOrTab(sheet_name, [
            [
                "Auto generated with Miu Discord Bot by @tix1 (253876413344514048). Do not modify.",
            ],
            [
                "Timestamp",
                "Discord Id",
                "Last Discord Username",
                "Osu Id",
                "Last Osu Username",
            ],
        ]);
        if (!has_sheet) throw new Error("Failed to interact with sheet.");

        return sheet;
    }

    async appendSheetForOsuRegistration(
        spreadsheet_id: string,
        sheet_name: string,
        discord_id,
        discord_username: string,
        osu_id,
        osu_username: string
    ) {
        const sheet = await this.getForOsuRegistration(spreadsheet_id, sheet_name);
        if (!sheet) throw new Error(`Failed to get spreadsheet`);

        await sheet.appendRow(`${sheet_name}!A1`, [
            [new Date().toISOString(), discord_id, discord_username, osu_id, osu_username]
        ]);
    }

    async checkDiscordIdExistInRegistration(
        spreadsheet_id: string,
        sheet_name: string,
        discord_id,
    ) {
        const sheet = await this.getForOsuRegistration(spreadsheet_id, sheet_name);
        if (!sheet) throw new Error(`Failed to get spreadsheet`);

        const range = await sheet.getSheetData(`${sheet_name}!A3:E`) ?? [];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [timestamp, discordid, discordusername, osuid, osu_username] of range.values()) {
            if (String(discordid) === String(discord_id))
                return osuid;
        }
        return;
    }

    async checkOsuIdExistInRegistration(
        spreadsheet_id: string,
        sheet_name: string,
        osu_id,
    ) {
        const sheet = await this.getForOsuRegistration(spreadsheet_id, sheet_name);
        if (!sheet) throw new Error(`Failed to get spreadsheet`);

        const range = await sheet.getSheetData(`${sheet_name}!A3:E`) ?? [];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [timestamp, discordid, discordusername, osuid, osu_username] of range.values()) {
            if (String(osuid) === String(osu_id))
                return discordid;
        }
        return;
    }

    async removeRegistrationByDiscordId(
        spreadsheet_id: string,
        sheet_name: string,
        discord_id,
    ) {
        const sheet = await this.getForOsuRegistration(spreadsheet_id, sheet_name);
        if (!sheet) throw new Error(`Failed to get spreadsheet`);

        const rangeString = `${sheet_name}!A3:E`;
        const range = await sheet.getSheetData(rangeString) ?? [];

        let n = 0;
        for (let i = range.length - 1; i >= 0; i--) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [timestamp, discordid] = range.at(i);
            if (String(discordid) === String(discord_id)) {
                await sheet.removeRow(rangeString, i);
                n++;
            }
        }
        return n;
    }
}
