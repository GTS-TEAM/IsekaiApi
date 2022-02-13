import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserResponseDto } from '../../search/dtos/search-user.dto';
import { UserDto } from '../../user/dtos/user.dto';

export class LoginResponseDto {
  @ApiProperty()
  @Expose()
  user: UserDto;

  @ApiProperty()
  @Expose()
  access_token: string;

  @ApiProperty()
  @Expose()
  refresh_token: string;
}
