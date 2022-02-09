import { Controller, Post, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ApiMultiFiles } from './decoration/upload.decoration';
import { UploadService } from './upload.service';
@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('/')
  @ApiConsumes('multipart/form-data')
  @ApiMultiFiles()
  @UseInterceptors(FilesInterceptor('files'))
  async uploadMultiFiles(@UploadedFiles() files: Array<Express.Multer.File>) {
    const uploadApiRes = await this.uploadService.uploadImageToCloudinary(files);
    return { urls: uploadApiRes.map((res) => res.secure_url) };
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
  async uploadMp3(@UploadedFile() file: Express.Multer.File) {
    const uploadApiRes = await this.uploadService.uploadFileToCloudinary(file);
    return { url: uploadApiRes.secure_url };
  }
}
