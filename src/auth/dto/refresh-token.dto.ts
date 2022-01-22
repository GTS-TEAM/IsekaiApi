import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhM2Q5YTVhZS03ODdmLTRjNTItODdhNC01MGRkYmJlMGUzZjIiLCJpYXQiOjE2NDAyNTc2MjMsImV4cCI6MTY0Mjg0OTYyM30.r9KLhzVPMmkRefCwCv9hL1rDngfFNjNIuHa8QOWH5jE',
  })
  refreshToken: string;
}
