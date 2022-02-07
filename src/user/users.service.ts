import { BadRequestException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { image } from 'faker';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserEntity } from './user';
import * as bcrypt from 'bcryptjs';
import { PostEntity } from '../post/entity/post';
import { ChangeInfoDto } from './users.controller';
import { FriendRequestEntity } from './entity/friend-request';
import { FriendRequestStatus } from '../shared/constants/enum';
// import { PostEntity } from '../post/entity/post';
// import { UserFollowerEntity } from 'src/user/user-follow';
@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);
  constructor(
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
    @InjectRepository(FriendRequestEntity) private friendRequestRepo: Repository<FriendRequestEntity>, // @InjectRepository(UserFollowerEntity) // private userFollowerRepo: Repository<UserFollowerEntity>,
  ) {}

  /**
   * COMMON
   */

  async getUserById(userId: string) {
    let user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }

  find(options?: FindOneOptions<UserEntity>): Promise<UserEntity[]> {
    return this.userRepo.find(options);
  }

  findOne(options?: FindOneOptions<UserEntity>): Promise<UserEntity> {
    return this.userRepo.findOne(options);
  }

  save(user: UserEntity): Promise<UserEntity> {
    return this.userRepo.save(user);
  }

  async getUserRelaFriendsById(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['friends'] });
    if (!user) {
      throw new UnauthorizedException('Không tìm thấy người dùng');
    }
    return user;
  }

  async deleteAllUsers(): Promise<void> {
    await this.userRepo.delete({});
  }

  /**
   * Authentication
   */

  async createUserRegister(userRegisterDto: UserRegisterDto): Promise<UserEntity> {
    const user = await this.userRepo.findOne({
      where: { email: userRegisterDto.email },
    });
    if (user) {
      throw new UnauthorizedException('Email already in use');
    }
    const userDoc = this.userRepo.create(userRegisterDto);
    userDoc.avatar = image.imageUrl();
    return this.userRepo.save(userDoc);
  }

  async createUser(user: UserEntity): Promise<UserEntity> {
    return this.userRepo.save(user);
  }

  async findByEmail(email: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({
      where: { email },
      select: ['id', 'username', 'avatar', 'password', 'bio', 'background'],
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy email');
    }
    return user;
  }

  isMatchPassword(password: string, hashPassword: string) {
    return bcrypt.compareSync(password, hashPassword);
  }

  /**
   * Conversation
   */

  async checkIfUserHasConversation(userId: string, friendId: string) {
    const thisUser = await this.userRepo
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.conversations', 'conversations')
      .leftJoinAndSelect('conversations.members', 'members')
      .where('users.id =:id', { id: userId })
      .getOne();

    const exist = thisUser?.conversations.some((conversation) => {
      return conversation.members.map((member) => member.id).includes(friendId);
    });

    if (exist) {
      return false;
    }
    const friend = await this.getUserById(friendId);
    return friend;
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

  /**
   * Friend
   */

  getFriendStatus(creatorId: string, receiverId: string) {
    return this.friendRequestRepo.findOne({
      where: [
        { creator: creatorId, receiver: receiverId },
        { creator: receiverId, receiver: creatorId },
      ],
    });
  }

  getFriends(userId: string) {
    return this.friendRequestRepo.find({ where: { creator: userId, status: FriendRequestStatus.ACCEPTED } });
  }

  getFriendRequests(userId: string): Promise<FriendRequestEntity[]> {
    return this.friendRequestRepo.find({ where: [{ receiver: userId }] });
  }

  async sendFriendRequest(userId: string, friendId: string) {
    if (userId == friendId) {
      throw new BadRequestException('Không thể kết bạn với bản thân !');
    }

    const frq = await this.getFriendStatus(userId, friendId);
    if (frq) {
      throw new BadRequestException('Bạn đã gửi yêu cầu kết bạn');
    }

    const user = await this.getUserById(userId);
    const friend = await this.getUserById(friendId);
    return this.friendRequestRepo.save({ creator: user, receiver: friend, status: FriendRequestStatus.PENDING });
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

  /**
   * Profile
   */

  async updateProfile(userId: string, profile: ChangeInfoDto): Promise<UserEntity> {
    let user = await this.getUserById(userId);

    for (var key in profile) {
      if (profile[key] !== null && profile[key] !== undefined) {
        user[key] = profile[key];
      }
    }
    return this.userRepo.save(user);
  }

  // Change password
  async changePassword(userId: string, password: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    user.password = password;
    return this.userRepo.save(user);
  }

  // Check user is friend or not
  async checkFriend(userId: string, friendId: string): Promise<boolean> {
    const user = await this.getUserRelaFriendsById(userId);
    const friend = await this.getUserById(friendId);
    if (user.friends.includes(friend)) {
      return true;
    }
    return false;
  }

  // Check user is following or not
  // async checkFollowing(userId: string, friendId: string): Promise<boolean> {
  //   const user = await this.getUserById(userId);
  //   const friend = await this.getUserById(friendId);
  //   if (user.following.includes(friend)) {
  //     return true;
  //   }
  //   return false;
  // }
}
