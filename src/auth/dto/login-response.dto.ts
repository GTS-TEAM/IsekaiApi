import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserResponseDto } from '../../search/dto/search-user.dto';

export class LoginResponseDto {
  @ApiProperty()
  @Expose()
  user: UserResponseDto;

  @ApiProperty()
  @Expose()
  access_token: string;

  @ApiProperty()
  @Expose()
  refresh_token: string;
}
