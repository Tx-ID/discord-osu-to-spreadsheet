import { google, sheets_v4 } from "googleapis";
import type { JWT } from "google-auth-library";

interface SpreadsheetConfig {
    spreadsheetId: string;
    clientEmail: string;
    privateKey: string;
    keyId: string;
}

export default class GoogleSpreadsheet {
    private sheets: sheets_v4.Sheets;
    private auth: JWT;

    constructor(private config: SpreadsheetConfig) {
        this.auth = new google.auth.JWT({
            email: config.clientEmail,
            key: config.privateKey,
            keyId: config.keyId,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        this.sheets = google.sheets({ version: "v4", auth: this.auth });
    }

    async getSheetMetadata() {
        try {
            return await this.sheets.spreadsheets.get({
                spreadsheetId: this.config.spreadsheetId,
            });
        } catch (err) {}
    }

    async createSheetOrTab(name: string, initial_data: any[][]) {
        let create = false;
        try {
            await this.getSheetData(`${name}!A1:A1`);
        } catch {
            create = true;
        }

        if (!create) return true;

        try {
            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.config.spreadsheetId,
                requestBody: {
                    requests: [
                        {
                            addSheet: {
                                properties: {
                                    title: name,
                                },
                            },
                        },
                    ],
                },
            });

            await this.updateSheetData(
                `${name}!A1:${initial_data.length}`,
                initial_data,
            )
                .then(() => {})
                .catch((err) => {
                    console.log(err);
                });

            return true;
        } catch (err) {}

        return false;
    }

    async getSheetData(range: string) {
        const result = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.config.spreadsheetId,
            range,
        });
        return result.data.values;
    }

    async updateSheetData(range: string, values: any[][]) {
        try {
            if (values.length === 0) {
                return await this.sheets.spreadsheets.values.clear({
                    spreadsheetId: this.config.spreadsheetId,
                    range,
                });
            }
            const response = await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.config.spreadsheetId,
                range,
                valueInputOption: "RAW",
                requestBody: {
                    values,
                },
            });
            return response;
        } catch (error) {
            console.error("Error updating data:", error);
            throw error;
        }
    }

    async removeRow(range: string, rowIndex: number) {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.config.spreadsheetId,
                range,
            });

            const values = response.data.values ?? [];

            if (!values || rowIndex < 0 || rowIndex >= values.length) {
                throw new Error("Invalid row index");
            }

            const n = values.splice(rowIndex, 1);
            values.push(n[0].map(() => ""));

            await this.updateSheetData(range, values);
        } catch (error) {
            console.error("Error removing row:", error);
            throw error;
        }
    }

    async appendRow(range: string, values: any[][]) {
        try {
            await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.config.spreadsheetId,
                range,
                valueInputOption: "RAW",
                insertDataOption: "INSERT_ROWS",
                requestBody: {
                    values,
                },
            });
        } catch {}
    }
}
