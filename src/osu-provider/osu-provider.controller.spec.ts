import { Test, TestingModule } from '@nestjs/testing';
import { OsuProviderController } from './osu-provider.controller';

describe('OsuProviderController', () => {
  let controller: OsuProviderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OsuProviderController],
    }).compile();

    controller = module.get<OsuProviderController>(OsuProviderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
