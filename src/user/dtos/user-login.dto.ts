import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UserLoginDto {
  @ApiProperty({ default: 'myacount@email.com' })
  @IsEmail()
  @IsString()
  readonly email: string;

  @ApiProperty({ default: 'mypassword' })
  @IsString()
  @IsNotEmpty()
  readonly password: string;
}
