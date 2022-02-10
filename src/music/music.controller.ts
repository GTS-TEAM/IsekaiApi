import { Body, Controller, Get, Post, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiProperty, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MusicService } from './music.service';
class YoutubeUrlToMp3Dto {
  @ApiProperty()
  url: string;
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
  @Post('/')
  async uploadMp3(@Request() req, @UploadedFile() file: Express.Multer.File) {
    const uploadApiRes = await this.musicService.uploadMusic(req.user, file);
    return { url: uploadApiRes.secure_url };
  }

  @Post('/youtube')
  async youtubeUrlToMp3(@Request() req, @Body() dto: YoutubeUrlToMp3Dto) {
    console.log(dto.url);

    const music = await this.musicService.uploadByYoutube(req.user, dto.url);
    return { message: 'Đã tải lên thành công', music };
  }
}
