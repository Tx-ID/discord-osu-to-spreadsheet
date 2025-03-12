import { Injectable } from "@nestjs/common";

import { ConfigService } from '@nestjs/config';
import Configuration from 'src/config';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const local_config = Configuration();

import GoogleSpreadsheet from "src/utilities/spreadsheet.utility";

@Injectable()
export class SpreadsheetService {
    private config: { email: string; id: string; key: string; };
    private sheets: Map<string, GoogleSpreadsheet>;

    constructor(
        _: ConfigService,
    ) {
        this.config = _.get<typeof local_config.sheets >('sheets');
        this.sheets = new Map();
    }

    async get(spreadsheet_id: string): Promise<GoogleSpreadsheet | undefined> {
        const sheet = this.sheets.get(spreadsheet_id);
        if (sheet) return sheet;

        const new_sheet = new GoogleSpreadsheet({
            clientEmail: this.config.email,
            privateKey: this.config.key,
            spreadsheetId: spreadsheet_id,
        });

        const valid = await new_sheet.getSheetMetadata();
        if (valid) {
            this.sheets.set(spreadsheet_id, new_sheet);
            return new_sheet;
        }
    }
}
