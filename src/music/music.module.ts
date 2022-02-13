import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadModule } from '../upload/upload.module';
import { UserModule } from '../user/users.module';
import { MusicEntity } from './music';
import { MusicController } from './music.controller';
import { MusicService } from './music.service';

@Module({
  imports: [TypeOrmModule.forFeature([MusicEntity]), UserModule, UploadModule],
  controllers: [MusicController],
  providers: [MusicService],
  exports: [MusicService, TypeOrmModule.forFeature([MusicEntity])],
})
export class MusicModule {}
