import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { image } from 'faker';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserEntity } from './user';
import * as bcrypt from 'bcryptjs';
// import { PostEntity } from '../post/entity/post';
// import { UserFollowerEntity } from 'src/user/user-follow';
@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);
  constructor(
    @InjectRepository(UserEntity) private repo: Repository<UserEntity>, // @InjectRepository(UserFollowerEntity) // private userFollowerRepo: Repository<UserFollowerEntity>,
  ) {}

  async checkIfUserHasConversation(user: UserEntity, friendId: string) {
    const thisUser = await this.repo
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.conversations', 'conversations')
      .leftJoinAndSelect('conversations.members', 'members')
      .where('users.id =:id', { id: user.id })
      .getOne();

    const exist = thisUser?.conversations.some((conversation) => {
      return conversation.members.map((member) => member.id).includes(friendId);
    });

    if (exist) {
      return false;
    }
    const friend = await this.repo.findOne({ where: { id: friendId } });
    return friend;
  }

  async find(options?: FindOneOptions<UserEntity>): Promise<UserEntity[]> {
    return this.repo.find(options);
  }

  async findOne(options?: FindOneOptions<UserEntity>): Promise<UserEntity> {
    return this.repo.findOne(options);
  }

  async save(user: UserEntity): Promise<UserEntity> {
    return this.repo.save(user);
  }

  // async userCreatePost(user: UserEntity, post: PostEntity): Promise<UserEntity> {
  //   user.posts = user.posts || [];
  //   user.posts.push(post);
  //   return this.repo.save(user);
  // }

  async createUserRegister(userRegisterDto: UserRegisterDto): Promise<UserEntity> {
    const user = await this.repo.findOne({
      where: { email: userRegisterDto.email },
    });
    if (user) {
      throw new UnauthorizedException('Email already in use');
    }
    const userDoc = this.repo.create(userRegisterDto);
    userDoc.profilePicture = image.imageUrl();
    return this.repo.save(userDoc);
  }

  async createUser(user: UserEntity): Promise<UserEntity> {
    return this.repo.save(user);
  }

  async findByEmail(email: string): Promise<UserEntity> {
    const user = await this.repo.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('Email not found');
    }
    // const userPayload = this.getWholeUserEntity(user);
    return user;
  }

  isMatchPassword(password: string, hashPassword: string) {
    return bcrypt.compareSync(password, hashPassword);
  }

  async findUserById(userId: string) {
    return await this.repo.findOne({ where: { id: userId } });
  }

  async getOneUser(userId: string) {
    const user = await this.findUserById(userId);
    // const userPayload = await this.getWholeUserEntity(user);
    return user;
  }

  // async getWholeUserEntity(user: UserEntity): Promise<any> {
  //   try {
  //     const following = await this.userFollowerRepo.find({
  //       where: { followers: user },
  //       relations: ['followers'],
  //     });
  //     const followers = await this.userFollowerRepo.find({
  //       where: { following: user },
  //       relations: ['following'],
  //     });
  //     const payload = {
  //       ...user,
  //       following: following.map((f: UserFollowerEntity) => {
  //         if (!f.following) return;
  //         return f.following;
  //       }),
  //       followers: followers.map((f: UserFollowerEntity) => f.followers),
  //     };
  //     return payload;
  //   } catch (error) {
  //     throw new BadRequestException(error);
  //   }
  // }

  getAllUsers(): Promise<UserEntity[]> {
    return this.repo.find({});
  }

  /**
   * Friend request
   */

  async addFriend(user: UserEntity, friendId: string) {
    const friend = await this.repo.findOne({ where: { id: friendId } });
    if (!friend) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
  }

  // follow user
  // async followUser(user: any, friendId: string): Promise<UserEntity> {
  //   try {
  //     const friend = await this.repo.findOne({
  //       where: { id: friendId },
  //     });
  //     if (!friend) {
  //       throw new NotFoundException('User not found');
  //     }
  //     if (user.following.length > 0) {
  //       const followed = user.following.some((friend: UserFollowerEntity) => {
  //         return friend?.id === friendId;
  //       });
  //       if (followed) {
  //         throw new NotFoundException('User already following');
  //       }
  //     }
  //     const userFollower = this.userFollowerRepo.create({
  //       followers: user,
  //       following: friend,
  //     });

  //     const userFollowerEntity = await this.userFollowerRepo.save(userFollower);

  //     user.following.push(userFollowerEntity);

  //     await this.repo.save(user);
  //     return friend;
  //   } catch (error) {
  //     throw new BadRequestException(error);
  //   }
  // }

  // unfollow user
  // async unFollowUser(user: UserEntity, friendId: string): Promise<void> {
  //   const friend = await this.repo.findOne({
  //     where: { id: friendId },
  //   });
  //   if (!friend) {
  //     throw new NotFoundException('User not found');
  //   }
  //   user.following = user.following.filter((friend: UserFollowerEntity) => friend?.id !== friendId);
  //   this.repo.save(user);
  // }

  // deleteAllUsers
  async deleteAllUsers(): Promise<void> {
    await this.repo.delete({});
  }
}
