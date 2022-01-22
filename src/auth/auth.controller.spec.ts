import { Test, TestingModule } from '@nestjs/testing';
import { RolesEnum } from '../shared/constants/enum';
import { TokenService } from '../token/token.service';
import { UserLoginDto } from '../user/dto/user-login.dto';
import { UserRegisterDto } from '../user/dto/user-register.dto';
import { UserService } from '../user/users.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  const tokenPayloadDto = {
    accessToken: '123',
    refreshToken: '123',
  };
  let controller: AuthController;
  const mockUserService: Partial<UserService> = {
    createUserRegister: jest.fn().mockImplementation((dto: UserRegisterDto) => {
      return {
        id: Date.now().toString(),
        email: dto.email,
      };
    }),
    findByEmail: jest.fn().mockImplementation((email) => {
      return true;
    }),
    isMatchPassword: jest.fn().mockImplementation((password, hashPassword) => true),
  };
  const mockTokenService: Partial<TokenService> = {
    generateAuthToken: jest.fn().mockImplementation((userId) => {
      return tokenPayloadDto;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: TokenService, useValue: mockTokenService },
      ],
    }).compile();
    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create user', async () => {
    const registerUser: UserRegisterDto = {
      email: 'myemail',
      username: 'Smith',
      password: 'password',
      roles: RolesEnum.ADMIN,
    };
    expect(await controller.registerUser(registerUser)).toEqual({
      id: expect.any(String),
      email: 'myemail',
    });
  });

  it('should user login', async () => {
    const userLoginDto: UserLoginDto = {
      email: 'myemail',
      password: 'password',
    };
    expect(await controller.login(userLoginDto)).toEqual(tokenPayloadDto);
  });
});
