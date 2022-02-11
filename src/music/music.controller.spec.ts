import { Test, TestingModule } from '@nestjs/testing';
import { MusicController, YoutubeUrlToMp3Dto } from './music.controller';
import { MusicService } from './music.service';

describe('MusicController', () => {
  let controller: MusicController;

  beforeEach(async () => {
    const ApiServiceProvider = {
      provide: MusicService,
      useFactory: () => ({
        youtubeUrlToMp3: jest.fn(() => {}),
      }),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MusicController],
      providers: [MusicService, ApiServiceProvider],
    }).compile();

    controller = module.get<MusicController>(MusicController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should be uploaded youtube video', () => {
    const dto = new YoutubeUrlToMp3Dto();
    expect(controller.youtubeUrlToMp3('', dto)).not.toEqual(null);
  });
});
