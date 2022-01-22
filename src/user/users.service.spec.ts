import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { RolesEnum } from '../shared/constants/enum';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserEntity } from './user';
import { UserService } from './users.service';
const registerUser: UserRegisterDto = {
  email: 'myemail1',
  username: 'Smith',
  password: 'password',
  roles: RolesEnum.ADMIN,
};
const fakeUserTable = [];

describe('UsersService', () => {
  let service: UserService;

  const mockUserRepository: Partial<Repository<UserEntity>> = {
    save: jest.fn().mockImplementation((user) => {
      const userDoc = {
        id: Date.now().toString(),
        password: `${registerUser.password}1`,
        ...registerUser,
      };
      fakeUserTable.push(userDoc);
      return Promise.resolve(userDoc);
    }),
    create: jest.fn().mockImplementation((dto) => dto),
    findOne: jest.fn().mockImplementation((args) => {
      const user = fakeUserTable.find((user) => user.email === args.where.email) as UserEntity;
      return Promise.resolve(user);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create user', async () => {
    expect(await service.createUserRegister(registerUser)).toEqual({
      id: expect.any(String),
      password: expect.not.stringMatching(registerUser.password),
      ...registerUser,
    });
  });

  it('should error if email already in use', async () => {
    try {
      await service.createUserRegister(registerUser);
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
    }
  });
});
