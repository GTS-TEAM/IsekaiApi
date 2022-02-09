import { ApiProperty } from '@nestjs/swagger';
import { NotiType } from '../../shared/constants/enum';

export class NotificationRequestDto {
  //   @ApiProperty()
  //   status: NotiStatus;

  @ApiProperty({ enum: NotiType })
  type: NotiType;

  @ApiProperty()
  refId: string;
}
