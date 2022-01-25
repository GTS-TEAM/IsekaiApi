import { Controller, Post, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { AnyFilesInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UploadService } from './upload.service';
@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}
  @ApiBody({
    type: 'multipart/form-data',
    description: 'Upload file',
    required: true,
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            description: 'File',
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @Post('/')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadMultiFiles(@UploadedFiles() files: Array<Express.Multer.File>) {
    const uploadApiRes = await this.uploadService.uploadImageToCloudinary(files);
    return { urls: uploadApiRes.map((res) => res.secure_url) };
  }
}
