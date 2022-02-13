import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { REGISTER_SUCCESS } from '../constants/response';

export class RegisterResponseDto {
  @ApiProperty({ example: REGISTER_SUCCESS })
  @Expose()
  message: string;
}
