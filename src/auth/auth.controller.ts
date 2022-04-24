import { Body, Controller, Get, HttpCode, NotFoundException, Patch, Post, Put, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Response } from 'express';
import { EmailService } from 'src/email/email.service';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { RolesEnum, TokenType } from '../common/constants/enum';
import { HttpExeptionDto } from '../error/error.dto';
import { TokenService } from '../token/token.service';
import { UserLoginDto } from '../user/dtos/user-login.dto';
import { UserRegisterDto } from '../user/dtos/user-register.dto';
import { UserService } from '../user/users.service';
import { AuthService } from './auth.service';
import { REGISTER_SUCCESS } from './constants/response';
import { LoginResponseDto } from './dtos/login-response.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { RegisterResponseDto } from './dtos/register-respose.dto';
import { TokenPayloadDto } from './dtos/token-payload.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleLoginDto } from './dtos/google-login.dto';
import { ResetPasswordDto, SendResetPasswordDto } from './dtos/login.dto';
import { hashPassword } from '../common/utils/hash-password';
class DeactivateRefreshTokenDto {
  @ApiProperty()
  @Expose()
  email: string;
}
@ApiTags('Authentication')
@Controller('/auth')
export class AuthController {
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
  @ApiOkResponse({ description: 'Return message registered successfully', type: RegisterResponseDto })
  @ApiBadRequestResponse({ description: 'Bad request', type: HttpExeptionDto })
  async registerUser(@Body() userRegisterDto: UserRegisterDto): Promise<{ message: string }> {
    await this.userService.createUserRegister(userRegisterDto);
    return { message: REGISTER_SUCCESS };
  }

  @ApiOkResponse({ description: 'Return user information and token', type: LoginResponseDto })
  @ApiNotFoundResponse({ description: 'Return exception email not found', type: HttpExeptionDto })
  @Post('/login')
  async login(@Body() userLoginDto: UserLoginDto): Promise<LoginResponseDto> {
    const user = await this.authService.validateUser(userLoginDto);
    const tokens = await this.tokenService.generateAuthToken(user);
    return {
      user,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    };
  }

  @ApiOkResponse({ description: 'Return user information and token', type: LoginResponseDto })
  @Post('/google')
  async googleLogin(@Body() dto: GoogleLoginDto) {
    const tokenPayload = await this.tokenService.verifyGoogleToken(dto.token);
    const user = await this.authService.googleLogin(tokenPayload);
    const tokens = await this.tokenService.generateAuthToken(user);
    return {
      user,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    };
  }

  @ApiOkResponse({ description: 'Return token', type: TokenPayloadDto })
  @Post('/refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const tokens = await this.tokenService.refreshToken(refreshTokenDto);
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    };
  }

  // verify email
  @ApiOkResponse({ description: 'Success' })
  @Get('/verify-email')
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    const user = await this.tokenService.verifyToken(token, TokenType.VerifyEmailToken);
    // await this.authService.verifyEmail(user);
    res.redirect('https://isekai.social/login');
  }

  @Post('/reset-password')
  async sendResetPassword(@Body() dto: SendResetPasswordDto) {
    const user = await this.userService.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy email');
    }
    const token = await this.tokenService.generateResetPasswordToken(dto.email);

    this.emailService.sendResetPasswordEmail({ to: dto.email, token: token.token });
  }

  @ApiOkResponse({ description: 'Success' })
  @Patch('/reset-password')
  async refreshPassword(@Body() dto: ResetPasswordDto) {
    const user = await this.tokenService.verifyToken(dto.token, TokenType.RefreshPasswordToken);
    user.password = hashPassword(dto.password);

    await this.userService.save(user);

    return {
      message: 'Reset password successfully',
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Success', type: DeactivateRefreshTokenDto })
  @Post('/deactivate-refresh-token')
  async deactivateRefreshToken(@Body() dto: DeactivateRefreshTokenDto) {
    return await this.tokenService.deactivateRefreshToken(dto.email);
  }
}
