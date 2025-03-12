import { Module } from '@nestjs/common';
import { OsuService } from './osu.service';

@Module({
  providers: [OsuService]
})
export class OsuModule {}
