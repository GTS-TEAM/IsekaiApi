import { Body, Controller, Get, HttpCode, Post, Query, Res, UseGuards } from '@nestjs/common';
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
