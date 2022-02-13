import { Body, Controller, Get, Post, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiProperty, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from '../upload/upload.service';
import { MusicService } from './music.service';
export class YoutubeUrlToMp3Dto {
  @ApiProperty()
  url: string;
}

export class UploadMusicDto {
  @ApiProperty()
  name: string;
}
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Music')
@Controller('music')
export class MusicController {
  constructor(private readonly musicService: MusicService) {}

  @Get('/')
  async getAllMusic(@Request() req) {
    return await this.musicService.getAllMusic(req.user);
  }

  @ApiBody({
    type: 'multipart/form-data',
    required: true,
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @Post('/file')
  async uploadMp3(@Request() req, @UploadedFile() file: Express.Multer.File) {
    return await this.musicService.uploadMusic(req.user, file);
  }

  @Post('/youtube')
  async youtubeUrlToMp3(@Request() req, @Body() dto: YoutubeUrlToMp3Dto) {
    const music = await this.musicService.uploadByYoutube(req.user, dto.url);
    return { message: 'Đã tải lên thành công', music };
  }
}
