import { Test, TestingModule } from '@nestjs/testing';
import { OsuProviderService } from './osu-provider.service';

describe('OsuProviderService', () => {
  let service: OsuProviderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OsuProviderService],
    }).compile();

    service = module.get<OsuProviderService>(OsuProviderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
