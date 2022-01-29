import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/users.service';
import { TokenService } from '../token/token.service';
import { UserLoginDto } from '../user/dto/user-login.dto';
import { UserEntity } from 'src/user/user';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  constructor(private readonly userService: UserService) {}

  async validateUser(userLoginDto: UserLoginDto): Promise<UserEntity> {
    const user = await this.userService.findByEmail(userLoginDto.email);
    const isMatchPassword = this.userService.isMatchPassword(userLoginDto.password, user.password);

    delete user.online;

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
