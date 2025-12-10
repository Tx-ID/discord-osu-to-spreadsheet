import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatToSpreadsheetDocument = ChatToSpreadsheet & Document;

@Schema({ timestamps: true })
export class ChatToSpreadsheet {
  @Prop({ required: true, unique: true })
  message_id: string;

  @Prop({ required: true })
  channel_id: string;

  @Prop({ required: true })
  spreadsheet_id: string;

  @Prop()
  sheet_name: string;

  @Prop({ type: Object })
  other_data: any;
}

export const ChatToSpreadsheetSchema = SchemaFactory.createForClass(ChatToSpreadsheet);
