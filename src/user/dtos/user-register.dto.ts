import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { RolesEnum } from '../../common/constants/enum';

export class UserRegisterDto {
  @ApiProperty({ default: 'Minh Nguyen' })
  @IsString()
  @IsNotEmpty()
  readonly username: string;

  @ApiProperty({ default: 'myacount@email.com' })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @ApiProperty({ minLength: 6, default: 'mypassword' })
  @IsString()
  @MinLength(6)
  readonly password: string;

  @ApiProperty({
    enum: RolesEnum,
    default: RolesEnum.USER,
    nullable: true,
  })
  readonly roles: RolesEnum;
}
