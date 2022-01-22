import { ApiProperty } from '@nestjs/swagger';

export class ErrorDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  statusCode: number;
}
