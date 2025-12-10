import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Osu, OsuSchema } from './schemas/osu.schema';
import { ChatToSpreadsheet, ChatToSpreadsheetSchema } from './schemas/chat-to-spreadsheet.schema';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongodb.uri'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeatureAsync([
      {
        name: Osu.name,
        useFactory: (config: ConfigService) => {
          const schema = OsuSchema;
          const ttl = config.get<number>('mongodb.ttl');
          schema.index({ createdAt: 1 }, { expireAfterSeconds: ttl });
          return schema;
        },
        inject: [ConfigService],
      },
      {
        name: ChatToSpreadsheet.name,
        useFactory: (config: ConfigService) => {
          const schema = ChatToSpreadsheetSchema;
          const ttl = config.get<number>('mongodb.ttl');
          schema.index({ createdAt: 1 }, { expireAfterSeconds: ttl });
          return schema;
        },
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
