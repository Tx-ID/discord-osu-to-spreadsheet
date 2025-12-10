import { Injectable } from "@nestjs/common";

import { ConfigService } from "@nestjs/config";
import Configuration from "src/config";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const local_config = Configuration();

import GoogleSpreadsheet from "src/utilities/spreadsheet.utility";

@Injectable()
export class SpreadsheetService {
    private config: typeof local_config.sheets;
    private osu_config: typeof local_config.osu;
    private sheets: Map<string, GoogleSpreadsheet>;

    constructor(_: ConfigService) {
        this.config = _.get<typeof local_config.sheets>("sheets");
        this.osu_config = _.get<typeof local_config.osu>("osu");
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

    async getAllOsuIds(spreadsheet_id: string, sheet_name: string) {
        const sheet = await this.getForOsuRegistration(spreadsheet_id, sheet_name);
        if (!sheet) throw new Error(`Failed to get spreadsheet`);

        const range = (await sheet.getSheetData(`${sheet_name}!A3:E`)) ?? [];
        return range
            .map((row) => row[3])
            .filter((id) => id && !isNaN(Number(id)));
    }

    private formatUsersForStats(users: any[]) {
        return users.map((user) => {
            const stats = user.statistics_rulesets;
            const getModeStats = (mode: string) => {
                const s = stats?.[mode];
                return [
                    s?.global_rank ?? "",
                    s?.pp ?? "",
                    s?.hit_accuracy ?? "",
                ];
            };

            return [
                user.id,
                user.username,
                user.country_code,
                ...getModeStats("osu"),
                ...getModeStats("taiko"),
                ...getModeStats("fruits"),
                ...getModeStats("mania"),
            ];
        });
    }

    private formatUsersForHitomi(users: any[], gamemode: string = "osu") {
        const blacklist = (this.osu_config.filtered_badges || []).map(s => s.toLowerCase());
        const blacklistRegex = blacklist.length > 0 
            ? new RegExp(blacklist.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), "i") 
            : null;

        return users.map((user) => {
            const stats = user.statistics_rulesets?.[gamemode];
            
            const badges = user.badges || [];
            const badgeCount = badges.filter(b => {
                const desc = (b.description || "").toLowerCase();
                if (blacklistRegex) return !blacklistRegex.test(desc);
                return true;
            }).length;

            return [
                user.id ?? "",
                user.username ?? "",
                user.country_code ?? "",
                stats?.global_rank ?? "",
                stats?.country_rank ?? "",
                stats?.pp ?? "0",
                stats?.level?.current ?? "0",
                stats?.ranked_score ?? "0",
                stats?.hit_accuracy ?? "0",
                stats?.play_count ?? "0",
                stats?.play_time ?? "0",
                stats?.maximum_combo ?? "0",
                stats?.replays_watched_by_others ?? "0",
                badgeCount ?? "0"
            ];
        });
    }

    async getOsuIdsFromStats(spreadsheet_id: string, sheet_name: string) {
        const stats_sheet_name = `${sheet_name} (Stats)`;
        const sheet = await this.get(spreadsheet_id);
        if (!sheet) return [];

        try {
            const range =
                (await sheet.getSheetData(`${stats_sheet_name}!A2:A`)) ?? [];
            return range
                .map((row) => row[0])
                .filter((id) => id && !isNaN(Number(id)));
        } catch {
            return [];
        }
    }

    async appendOsuStats(
        spreadsheet_id: string,
        sheet_name: string,
        users: any[]
    ) {
        const stats_sheet_name = `${sheet_name} (Stats)`;
        const sheet = await this.get(spreadsheet_id);
        if (!sheet) throw new Error("Failed to read spreadsheet.");

        const data = this.formatUsersForStats(users);
        await sheet.appendRow(`${stats_sheet_name}!A1`, data);
    }

    async updateOsuStats(
        spreadsheet_id: string,
        sheet_name: string,
        users: any[]
    ) {
        const stats_sheet_name = `${sheet_name} (Stats)`;
        const sheet = await this.get(spreadsheet_id);
        if (!sheet) throw new Error("Failed to read spreadsheet.");

        const headers = [
            "ID",
            "Username",
            "Country",
            "STD Global Rank",
            "STD PP",
            "STD Acc",
            "Taiko Global Rank",
            "Taiko PP",
            "Taiko Acc",
            "CtB Global Rank",
            "CtB PP",
            "CtB Acc",
            "Mania Global Rank",
            "Mania PP",
            "Mania Acc",
        ];

        const data = this.formatUsersForStats(users);

        await sheet.createSheetOrTab(stats_sheet_name, [headers, ...data]);
        await sheet.updateSheetData(`${stats_sheet_name}!A1`, [
            headers,
            ...data,
        ]);
    }

    async updateHitomiStats(
        spreadsheet_id: string,
        sheet_name: string,
        users: any[],
        gamemode: string = "osu"
    ) {
        const hitomi_sheet_name = `_api`;
        const sheet = await this.get(spreadsheet_id);
        if (!sheet) throw new Error("Failed to read spreadsheet.");

        const headers = [
             "User ID", "Username", "Country Code", "Global Rank", "Country Rank",
             "PP", "Level", "Ranked Score", "Accuracy", "Playcount", 
             "Playtime", "Max Combo", "Replays Watched", "Badge Count"
        ];

        const data = this.formatUsersForHitomi(users, gamemode);

        await sheet.createSheetOrTab(hitomi_sheet_name, []);
        
        await sheet.updateSheetData(`${hitomi_sheet_name}!D2`, [headers, ...data]);
    }
}