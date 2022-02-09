import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { resizeAvatar } from 'src/shared/utils/resize-image';
import { UserEntity } from 'src/user/user';
import { UserLoginDto } from '../user/dto/user-login.dto';
import { UserService } from '../user/users.service';
@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  constructor(private readonly userService: UserService) {}

  async validateUser(userLoginDto: UserLoginDto): Promise<UserEntity> {
    const user = await this.userService.findByEmail(userLoginDto.email);
    const isMatchPassword = this.userService.isMatchPassword(userLoginDto.password, user.password);

    delete user.online;
    user.avatar = resizeAvatar(40, 40, user.avatar);

    if (!isMatchPassword) {
      throw new UnauthorizedException('Password is incorrect');
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
