import { ApiProperty } from '@nestjs/swagger';
import { AbstractDto } from '../../common/abstract.dto';
import { UserDto } from '../../user/dtos/user.dto';

export class PostResponseDto extends AbstractDto {
  @ApiProperty()
  description: string;

  @ApiProperty()
  image?: string[];

  @ApiProperty({ nullable: true })
  emoji?: number;

  @ApiProperty({ type: UserDto })
  user: UserDto;

  @ApiProperty({ isArray: true, type: UserDto })
  likes: UserDto[];

  @ApiProperty()
  commentCount: number;

  @ApiProperty()
  likeCount: number;

  @ApiProperty()
  liked: boolean;
}
