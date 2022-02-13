import { ApiProperty } from '@nestjs/swagger';
import { RolesEnum } from '../../common/constants/enum';
import { UserInfo } from './user-info';

export class UserDto extends UserInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  created_at: Date;
  // @ApiProperty({ default: false })
  // @Expose()
  // emailVerified: boolean;

  // @ApiProperty()
  // @Expose()
  // followers: Array<string>;

  // @ApiProperty()
  // @Expose()
  // following: Array<string>;
}
