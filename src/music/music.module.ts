import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { UserModule } from '../user/users.module';
import { MusicEntity } from './music';
import { MusicController } from './music.controller';
import { MusicService } from './music.service';

@Module({
  imports: [TypeOrmModule.forFeature([MusicEntity]), CloudinaryModule, UserModule],
  controllers: [MusicController],
  providers: [MusicService],
  exports: [MusicService, TypeOrmModule.forFeature([MusicEntity])],
})
export class MusicModule {}
