import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from '../../user/dto/user.dto';

export class PostResponseDto {
  @ApiProperty({ type: UserDto })
  user: UserDto;

  @ApiProperty()
  id: string;

  @ApiProperty()
  image: string[];

  @ApiProperty()
  description: string;

  @ApiProperty()
  liked: boolean;

  @ApiProperty()
  likes: number;

  @ApiProperty()
  comments: number;

  @ApiProperty({ nullable: true })
  emoji?: number;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
