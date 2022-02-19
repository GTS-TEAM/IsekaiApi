import { ApiProperty } from '@nestjs/swagger';
import { RolesEnum } from '../../common/constants/enum';

export class UserInfo {
  @ApiProperty()
  email: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  avatar?: string;

  @ApiProperty()
  background?: string;

  @ApiProperty({ default: RolesEnum.USER })
  roles: RolesEnum;

  @ApiProperty()
  phone?: string;

  @ApiProperty()
  date?: Date;

  @ApiProperty()
  address?: string;
}
