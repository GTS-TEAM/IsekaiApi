import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { RolesEnum } from '../../shared/constants/enum';

export class UserDto {
  @ApiProperty({ default: 1 })
  @Expose()
  id: string;

  @ApiProperty({ default: 'myacount@email.com' })
  @Expose()
  email: string;

  @ApiProperty({ default: 'Minh Nguyen' })
  @Expose()
  username: string;

  @ApiProperty({ default: 'https://' })
  @Expose()
  profilePicture: string;

  @ApiProperty({ default: RolesEnum.USER })
  @Expose()
  roles: RolesEnum;

  @ApiProperty({ default: false })
  @Expose()
  emailVerified: boolean;

  @ApiProperty()
  @Expose()
  followers: Array<string>;

  @ApiProperty()
  @Expose()
  following: Array<string>;

  @ApiProperty()
  @Expose()
  created_at: Date;

  @ApiProperty()
  @Expose()
  updated_at: Date;
}
