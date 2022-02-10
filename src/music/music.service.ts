import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import * as ytdl from 'ytdl-core';
import { MusicEntity } from './music';
import { UserEntity } from '../user/user';

@Injectable()
export class MusicService {
  constructor(
    @InjectRepository(MusicEntity) private musicRepo: Repository<MusicEntity>,
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async getAllMusic(userId: string): Promise<any> {
    const musics = await this.musicRepo.find({ order: { create_at: 'DESC' }, relations: ['uploader'] });
    return musics;
  }

  async uploadMusic(userId: string, file: Express.Multer.File): Promise<any> {
    const user = await this.userRepo.findOne(userId);
    if (!user) throw new Error('User not found');
    const music = new MusicEntity();
    music.uploader = user;
    music.name = file.originalname;
    music.url = await (await this.cloudinaryService.uploadFile(file)).secure_url;
    return await this.musicRepo.save(music);
  }

  async uploadByYoutube(userId: string, url: string): Promise<any> {
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      const uploadApiRes = await this.cloudinaryService.youtubeUrlToMp3(url);
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
