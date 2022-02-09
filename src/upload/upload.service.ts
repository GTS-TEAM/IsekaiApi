import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly cloudinary: CloudinaryService) {}
  async uploadImageToCloudinary(files: Array<Express.Multer.File>): Promise<(UploadApiResponse | UploadApiErrorResponse)[]> {
    return await this.cloudinary.uploadImage(files).catch((e) => {
      this.logger.error(e);
      throw new BadRequestException('Invalid file type.', e.message);
    });
  }

  async uploadFileToCloudinary(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
    try {
      return await this.cloudinary.uploadFile(file);
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Có lỗi xảy ra vui lòng thử lại', error.message);
    }
  }
}
