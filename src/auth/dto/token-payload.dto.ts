import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class TokenPayloadDto {
  @ApiProperty({
    default:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NzZhZDVhOC1lM2ZlLTQ3OWMtOWUzMy05MDg1OWM0NjQ5MmMiLCJpYXQiOjE2Mzc2MTQ1NDcsImV4cCI6MTY0MDIwNjU0N30.lEfJe-IUIR3aN3NSTDq2Yf6qqoRk_mKdXFM4c_C-Fuw',
  })
  @Expose()
  accessToken: string;

  @ApiProperty({
    default:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NzZhZDVhOC1lM2ZlLTQ3OWMtOWUzMy05MDg1OWM0NjQ5MmMiLCJpYXQiOjE2Mzc2MTQ5OTMsImV4cCI6MTY0MDIwNjk5M30.yejwcCICdkYsBB3qdyjf4kLjgEXLLwZwibvQbTV8UJQ',
  })
  @Expose()
  refreshToken: string;
}
