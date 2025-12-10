import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OsuDocument = Osu & Document;

@Schema({ timestamps: true })
export class Osu {
  @Prop({ required: true, unique: true })
  discordId: string;

  @Prop({ required: true })
  osuId: string;

  @Prop({ required: true })
  osuUsername: string;

  @Prop()
  is_restricted: boolean;

  @Prop()
  expiresAt?: Date;
}

export const OsuSchema = SchemaFactory.createForClass(Osu);
