import { Body, Controller, Post, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiProperty, ApiTags } from '@nestjs/swagger';
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
}
