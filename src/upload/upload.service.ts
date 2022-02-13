import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { UploadApiErrorResponse, UploadApiResponse, v2 } from 'cloudinary';
import * as ytdl from 'ytdl-core';
import { Readable } from 'typeorm/platform/PlatformTools';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  async uploadImageToCloudinary(files: Array<Express.Multer.File>): Promise<(UploadApiResponse | UploadApiErrorResponse)[]> {
    return await this.uploadImage(files).catch((e) => {
      this.logger.error(e);
      throw new BadRequestException('Invalid file type.', e.message);
    });
  }

  async uploadImage(files: Array<Express.Multer.File>) {
    return Promise.all(files.map((file) => this.uploadStream(file)));
  }

  async uploadStream(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const upload = v2.uploader.upload_stream((error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
      Readable.from(file.buffer).pipe(upload);
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return await new Promise((resolve, reject) => {
      v2.uploader
        .upload_stream({ resource_type: 'video', image_metadata: true }, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        })
        .end(file.buffer);
    });
  }

  async youtubeUrlToMp3(url: string): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const upload = v2.uploader.upload_stream({ resource_type: 'video', image_metadata: true }, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
      ytdl(url, { filter: 'audioonly' }).pipe(upload);
    });
  }
}
