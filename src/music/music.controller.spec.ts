import { Test, TestingModule } from '@nestjs/testing';
import { MusicEntity } from './music';
import { MusicController, YoutubeUrlToMp3Dto } from './music.controller';
import { MusicService } from './music.service';

const OneMusic = new MusicEntity();

describe('MusicController', () => {
  let controller: MusicController;

  beforeEach(async () => {
    const ApiServiceProvider = {
      provide: MusicService,
      useFactory: () => ({
        uploadByYoutube: jest.fn().mockImplementation(() => Promise.resolve(OneMusic)),
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

  it('should be uploaded youtube video', async () => {
    const dto = new YoutubeUrlToMp3Dto();
    expect(await controller.youtubeUrlToMp3('', dto)).not.toEqual(null);
  });
});
