import { ApiProperty } from '@nestjs/swagger';

export class CommentRequestDto {
  @ApiProperty({ default: 'Hi user' })
  comment: string;
}
