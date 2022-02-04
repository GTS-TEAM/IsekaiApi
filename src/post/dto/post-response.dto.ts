import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../../user/user';

export class PostResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  image: string[];
  @ApiProperty({ nullable: true })
  emoji?: number;
  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
  @ApiProperty()
  user: UserEntity;

  @ApiProperty({ isArray: true, type: UserEntity })
  likes: UserEntity[];

  @ApiProperty()
  commentCount: number;

  @ApiProperty()
  likeCount: number;

  @ApiProperty()
  liked: boolean;
}
