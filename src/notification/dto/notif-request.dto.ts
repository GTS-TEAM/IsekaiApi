import { ApiProperty } from '@nestjs/swagger';
import { NotiStatus, NotiType } from '../../shared/constants/enum';

export class NotificationRequestDto {
  //   @ApiProperty()
  //   status: NotiStatus;

  @ApiProperty()
  type: NotiType;

  @ApiProperty()
  refId: string;
}
