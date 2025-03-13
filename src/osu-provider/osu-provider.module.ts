import { Module } from "@nestjs/common";
import { OsuProviderService } from "./osu-provider.service";
import { OsuProviderController } from './osu-provider.controller';

import { OsuModule } from "src/osu/osu.module";
import { DatabaseModule } from "src/database/database.module";

@Module({
    imports: [OsuModule, DatabaseModule],
    providers: [OsuProviderService],
    exports: [OsuProviderService],
    controllers: [OsuProviderController],
})
export class OsuProviderModule {}
