import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshTokenDto } from 'src/auth/dtos/refresh-token.dto';
import { Repository } from 'typeorm';
import { TokenPayloadDto } from '../auth/dtos/token-payload.dto';
import constants from '../common/constants/constants';
import { TokenType } from '../common/constants/enum';
import { UserEntity } from '../user/user';
import { Tokens } from './token.entity';
import { OAuth2Client } from 'google-auth-library';
@Injectable()
export class TokenService {
  private logger = new Logger(TokenService.name);
  constructor(
    @InjectRepository(Tokens) private tokenRepo: Repository<Tokens>,
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  //   const {OAuth2Client} = require('google-auth-library');
  // const client = new OAuth2Client(CLIENT_ID);
  // async function verify() {
  //   const ticket = await client.verifyIdToken({
  //       idToken: token,
  //       audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
  //       // Or, if multiple clients access the backend:
  //       //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  //   });
  //   const payload = ticket.getPayload();
  //   const userid = payload['sub'];
  //   // If request specified a G Suite domain:
  //   // const domain = payload['hd'];
  // }
  // verify().catch(console.error);
  async verifyGoogleToken(token: string) {
    const client = new OAuth2Client(this.configService.get(constants.GOOGLE_CLIENT_ID));
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: this.configService.get(constants.GOOGLE_CLIENT_ID),
    });
    return ticket.getPayload();
  }

  async generateAuthToken(user: UserEntity): Promise<TokenPayloadDto> {
    const access_token = this.generateToken(user, constants.JWT_ACCESS_EXPIRATION);

    const refresh_token = this.generateToken(user, constants.JWT_REFRESH_EXPIRATION);
    await this.saveToken(refresh_token, user, TokenType.RefreshToken);
    return {
      access_token,
      refresh_token,
    };
  }

  async saveToken(token: string, user: UserEntity, tokenType: TokenType) {
    let tokenDoc = await this.tokenRepo.findOne({
      where: { user, type: tokenType },
    });
    if (tokenDoc) {
      tokenDoc.token = token;
      tokenDoc.active = true;
    } else {
      tokenDoc = this.tokenRepo.create({
        token,
        user,
        type: tokenType,
      });
    }
    return this.tokenRepo.save(tokenDoc);
  }

  generateToken(user: UserEntity, expires: string | number) {
    const payload = { sub: user.id };
    return this.jwtService.sign(payload, {
      expiresIn: expires,
      secret: this.configService.get(constants.JWT_SECRET_KEY),
    });
  }

  async verifyToken(token: string, type: TokenType) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get(constants.JWT_SECRET_KEY),
      });
      if (type !== TokenType.AccessToken) {
        const tokenDoc = await this.tokenRepo.findOne({
          relations: ['user'],
          where: {
            token,
            type,
            user: payload.sub,
          },
        });
        if (!tokenDoc) {
          throw new Error('Token không tồn tại');
        }
        if (type === TokenType.VerifyEmailToken) {
          tokenDoc.active = false;
          await this.tokenRepo.save(tokenDoc);
        }
        return tokenDoc.user;
      }
      return await this.userRepo.findOne({ where: { id: payload.sub } });
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const tokenPayload = await this.verifyToken(refreshTokenDto.refresh_token, TokenType.RefreshToken);
    return this.generateAuthToken(tokenPayload);
  }

  async generateVerifyEmailToken(user: UserEntity) {
    const verifyEmailToken = this.generateToken(user, this.configService.get(constants.JWT_VERIFY_EMAIL_EXPIRATION));
    await this.saveToken(verifyEmailToken, user, TokenType.VerifyEmailToken);
    return verifyEmailToken;
  }

  async generateResetPasswordToken(userEmail: string) {
    const user = await this.userRepo.findOne({ where: { email: userEmail } });
    if (!user) {
      throw new NotFoundException('Email does not exist');
    }
    const refreshPasswordToken = this.generateToken(user, this.configService.get(constants.JWT_RESET_PASSWORD_EXPIRATION));
    return await this.saveToken(refreshPasswordToken, user, TokenType.RefreshPasswordToken);
  }
  // deactivate refresh token
  async deactivateRefreshToken(email: string) {
    const tokenDoc = await this.tokenRepo.findOne({
      relations: ['user'],
      where: { user: { email } },
    });
    if (!tokenDoc) {
      throw new NotFoundException('Token does not exist');
    }
    tokenDoc.active = false;
    return await this.tokenRepo.save(tokenDoc);
  }
}
