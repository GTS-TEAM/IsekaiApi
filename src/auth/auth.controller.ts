import { BadRequestException, Body, Controller, Get, HttpCode, Logger, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Response } from 'express';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { EmailService } from 'src/email/email.service';
import { RolesEnum, TokenType } from '../shared/constants/enum';
import { TokenService } from '../token/token.service';
import { UserLoginDto } from '../user/dto/user-login.dto';
import { UserRegisterDto } from '../user/dto/user-register.dto';
import { UserDto } from '../user/dto/user.dto';
import { Serialize } from '../user/users.interceptor';
import { UserService } from '../user/users.service';
import { AuthService } from './auth.service';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
class DeactivateRefreshTokenDto {
  @ApiProperty()
  @Expose()
  email: string;
}
@ApiTags('Authentication')
@Controller('/auth')
export class AuthController {
  private logger = new Logger(AuthController.name);
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
  ) {}

  // @Serialize(UserDto)
  // @ApiCreatedResponse({
  //   description: 'User created successfully',
  //   type: UserDto,
  // })
  @Post('/register')
  async registerUser(@Body() userRegisterDto: UserRegisterDto) {
    try {
      await this.userService.createUserRegister(userRegisterDto);
      return { message: 'Successfully registered' };
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException(error);
    }
  }

  @ApiOkResponse({ description: 'Success', type: LoginResponseDto })
  @HttpCode(200)
  @Post('/login')
  async login(@Body() userLoginDto: UserLoginDto): Promise<any> {
    const user = await this.authService.validateUser(userLoginDto);
    const tokens = await this.tokenService.generateAuthToken(user);
    return {
      user,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  }

  @Post('/refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const tokens = await this.tokenService.refreshToken(refreshTokenDto);
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  }

  // verify email
  @ApiOkResponse({ description: 'Success' })
  @Get('/verify-email')
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    const user = await this.tokenService.verifyToken(token, TokenType.VerifyEmailToken);
    // await this.authService.verifyEmail(user);
    res.redirect('http://localhost:3000');
  }

  // @ApiOkResponse({ description: 'Success' })
  // @Get('/refresh-password')
  // async refreshPassword(@Query('token') token: string, @Res() res: Response) {
  //   const user = await this.tokenService.verifyToken(
  //     token,
  //     TokenType.RefreshPasswordToken,
  //   );
  //   const tokens = await this.tokenService.generateAuthToken(user);
  //   return {
  //     user,
  //     access_token: tokens.accessToken,
  //     refresh_token: tokens.refreshToken,
  //   };
  // }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Success', type: DeactivateRefreshTokenDto })
  @Post('/deactivate-refresh-token')
  async deactivateRefreshToken(@Body() dto: DeactivateRefreshTokenDto) {
    return await this.tokenService.deactivateRefreshToken(dto.email);
  }
}
