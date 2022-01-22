import { ApiProperty } from '@nestjs/swagger';

export class PostDto {
  @ApiProperty()
  readonly image: string;

  @ApiProperty()
  readonly description: string;
}
