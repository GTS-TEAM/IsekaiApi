import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class HttpExeptionDto {
  @ApiProperty()
  error: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ default: 500 })
  statusCode: number;
}

export class HttpBadRequestExeption {
  @ApiProperty()
  error: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ default: 400 })
  statusCode: number;
}

export class ConversationNotFoundException extends HttpException {
  constructor() {
    super('Không tìm thấy cuộc trò chuyện', HttpStatus.NOT_FOUND);
  }
}

export class AnErrorOccuredException extends HttpException {
  constructor(mesage: string) {
    super('Đã xảy ra lỗi: ' + mesage, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
