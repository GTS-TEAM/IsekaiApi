import { ApiProperty } from '@nestjs/swagger';
import { NotiType } from '../../common/constants/enum';

export class NotificationRequestDto {
  //   @ApiProperty()
  //   status: NotiStatus;

  @ApiProperty({ enum: NotiType })
  type: NotiType;

  @ApiProperty()
  refId: string;
}
