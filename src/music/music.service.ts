import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ytdl from 'ytdl-core';
import { MusicEntity } from './music';
import { UserEntity } from '../user/user';
import { UploadService } from '../upload/upload.service';
import { UserService } from '../user/users.service';
import { IPage } from '../interfaces/page.interface';

@Injectable()
export class MusicService {
  constructor(
    @InjectRepository(MusicEntity) private musicRepo: Repository<MusicEntity>,
    private readonly userService: UserService,
    private readonly uploadService: UploadService,
  ) {}

  async getAllMusic(userId: string, paging: IPage): Promise<MusicEntity[]> {
    // const musics = await this.musicRepo.find({ order: { created_at: 'DESC' }, relations: ['uploader'] });
    const qb = this.musicRepo
      .createQueryBuilder('music')
      .leftJoinAndSelect('music.uploader', 'user')
      .orderBy('music.created_at', 'DESC');

    if (paging.limit) {
      qb.limit(paging.limit);
    }
    if (paging.offset) {
      qb.offset((paging.offset - 1) * paging.limit);
    }
    if (paging.search) {
      qb.where('music.name ILIKE :search', { search: `%${paging.search}%` });
    }

    return qb.getMany();
  }

  async uploadMusic(userId: string, file: Express.Multer.File): Promise<MusicEntity> {
    try {
      const user = await this.userService.getUserById(userId);
      if (!user) throw new BadRequestException('Không tìm thấy người dùng');
      const uploadApiRes = await this.uploadService.uploadFile(file);

      const music = new MusicEntity();
      music.uploader = user;
      music.name = file.originalname;
      music.url = uploadApiRes.secure_url;
      music.duration = parseInt(uploadApiRes.duration);
      return await this.musicRepo.save(music);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async uploadByYoutube(userId: string, url: string): Promise<MusicEntity> {
    try {
      const user = await this.userService.getUserById(userId);
      const uploadApiRes = await this.uploadService.youtubeUrlToMp3(url);
      let info = await ytdl.getInfo(url);

      const music = this.musicRepo.create({
        name: info.videoDetails.title,
        url: uploadApiRes.secure_url,
        uploader: user,
        duration: parseInt(info.videoDetails.lengthSeconds),
        author: info.videoDetails.author.name,
      });
      return await this.musicRepo.save(music);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
