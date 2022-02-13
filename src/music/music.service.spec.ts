import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MusicService } from './music.service';
import { MusicEntity } from './music';
import { UserEntity } from '../user/user';
import { UploadApiResponse } from 'cloudinary';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

const OneMusic = new MusicEntity();
const OneUser = new UserEntity();

const MusicArray = [new MusicEntity(), new MusicEntity(), new MusicEntity()];
const UserArray = [new UserEntity()];

describe('MusicService', () => {
  let service: MusicService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MusicService,
        {
          provide: getRepositoryToken(MusicEntity),
          useValue: {
            find: jest.fn().mockResolvedValue(MusicArray),
            findOneOrFail: jest.fn().mockResolvedValue(OneMusic),
            create: jest.fn().mockReturnValue(OneMusic),
            save: jest.fn().mockReturnValue(OneMusic),
            // // as these do not actually use their return values in our sample
            // // we just make sure that their resolve is true to not crash
            // update: jest.fn().mockResolvedValue(true),
            // // as these do not actually use their return values in our sample
            // // we just make sure that their resolve is true to not crash
            // delete: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            find: jest.fn().mockResolvedValue(UserArray),
            findOne: jest.fn().mockImplementation((args) => {
              return Promise.resolve(OneUser);
            }),
            findOneOrFail: jest.fn().mockImplementation(() => Promise.resolve(OneUser)),
            create: jest.fn().mockImplementation(() => Promise.resolve(OneUser)),
            save: jest.fn().mockImplementation(() => Promise.resolve(OneUser)),
          },
        },
        {
          provide: CloudinaryService,
          useValue: {
            uploadByYoutube: jest.fn().mockReturnValue({}),
            youtubeUrlToMp3: jest.fn().mockImplementation((a) => Promise.resolve({ secure_url: '' })),
          },
        },
      ],
    }).compile();

    service = module.get<MusicService>(MusicService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be save music', async () => {
    expect(await service.uploadByYoutube('q', 'https://www.youtube.com/watch?v=yJ3XKNQv7Qk')).not.toBeNull();
  });
});
