import { Module } from '@nestjs/common';
import { SpreadsheetService } from './spreadsheet.service';

@Module({
  providers: [SpreadsheetService],
  exports: [SpreadsheetService],
})
export class SpreadsheetModule {}
