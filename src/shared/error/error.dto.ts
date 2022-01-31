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
