import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { TokenPayload } from 'google-auth-library';
import { resizeAvatar } from 'src/common/utils/resize-image';
import { UserEntity } from 'src/user/user';
import { UserLoginDto } from '../user/dtos/user-login.dto';
import { UserService } from '../user/users.service';
import { GoogleLoginDto } from './dtos/google-login.dto';
@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  constructor(private readonly userService: UserService) {}

  async validateUser(userLoginDto: UserLoginDto): Promise<UserEntity> {
    const user = await this.userService.findByEmail(userLoginDto.email);
    const isMatchPassword = this.userService.isMatchPassword(userLoginDto.password, user.password);

    if (!isMatchPassword) {
      throw new UnauthorizedException('Password is incorrect');
    }
    user.avatar = resizeAvatar(40, 40, user.avatar);
    this.userService.healthCheck(user.id);
    return user;
  }

  async googleLogin(tokenPayload: TokenPayload): Promise<UserEntity> {
    let user = await this.userService.findOne({ where: { email: tokenPayload.email } });

    if (!user) {
      user = await this.userService.createUser(tokenPayload.email, tokenPayload.name, tokenPayload.picture);
    }

    return user;
  }

  // verify email
  // async verifyEmail(user: UserEntity): Promise<void> {
  //   if (user.emailVerified) {
  //     throw new UnauthorizedException('Email already verified');
  //   }
  //   user.emailVerified = true;
  //   await this.userService.save(user);
  // }
}
