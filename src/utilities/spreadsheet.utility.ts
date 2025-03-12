import { google, sheets_v4 } from "googleapis";
import { JWT } from "google-auth-library";

interface SpreadsheetConfig {
    spreadsheetId: string;
    clientEmail: string;
    privateKey: string;
}

export default class GoogleSpreadsheet {
    private sheets: sheets_v4.Sheets;
    private auth: JWT;

    constructor(private config: SpreadsheetConfig) {
        this.auth = new google.auth.JWT({
            email: config.clientEmail,
            key: config.privateKey,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        this.sheets = google.sheets({ version: "v4", auth: this.auth });
    }

    async getSheetData(range: string) {
        try {
            const result = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.config.spreadsheetId,
                range,
            });
            return result.data.values;
        } catch (error) {
            console.error("Error fetching data:", error);
            throw error;
        }
    }

    async updateSheetData(range: string, values: any[][]) {
        try {
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.config.spreadsheetId,
                range,
                valueInputOption: "RAW",
                requestBody: {
                    values,
                },
            });
        } catch (error) {
            console.error("Error updating data:", error);
            throw error;
        }
    }
}
