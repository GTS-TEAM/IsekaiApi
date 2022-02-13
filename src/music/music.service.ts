import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ytdl from 'ytdl-core';
import { MusicEntity } from './music';
import { UserEntity } from '../user/user';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class MusicService {
  constructor(
    @InjectRepository(MusicEntity) private musicRepo: Repository<MusicEntity>,
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
    private readonly uploadService: UploadService,
  ) {}

  async getAllMusic(userId: string): Promise<any> {
    const musics = await this.musicRepo.find({ order: { create_at: 'DESC' }, relations: ['uploader'] });
    return musics;
  }

  async uploadMusic(userId: string, file: Express.Multer.File) {
    const user = await this.userRepo.findOne(userId);
    if (!user) throw new BadRequestException('Không tìm thấy người dùng');
    const music = new MusicEntity();
    music.uploader = user;
    music.name = file.originalname;
    music.url = await (await this.uploadService.uploadFile(file)).secure_url;
    return await this.musicRepo.save(music);
  }

  async uploadByYoutube(userId: string, url: string): Promise<any> {
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      const uploadApiRes = await this.uploadService.youtubeUrlToMp3(url);
      let info = await ytdl.getInfo(url);

      const musicSnapshot = await this.musicRepo.save({
        name: info.videoDetails.title,
        url: uploadApiRes.secure_url,
        uploader: user,
        duration: parseInt(info.videoDetails.lengthSeconds),
        author: info.videoDetails.author.name,
      });

      return musicSnapshot;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
