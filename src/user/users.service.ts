import { BadRequestException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { image } from 'faker';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { UserRegisterDto } from './dtos/user-register.dto';
import { UserEntity } from './user';
import { FriendRequestEntity } from './entities/friend-request';
import { FriendRequestResponse, FriendRequestStatus } from '../common/constants/enum';
import { ChangePasswordDto } from './dtos/change-password.dto';
import * as bcrypt from 'bcryptjs';
import { hashPassword } from '../common/utils/hash-password';
import { UserInfo } from './dtos/user-info';

// import { PostEntity } from '../post/entity/post';
// import { UserFollowerEntity } from 'src/user/user-follow';
@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);
  constructor(
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
    @InjectRepository(FriendRequestEntity) private friendRequestRepo: Repository<FriendRequestEntity>, // @InjectRepository(UserFollowerEntity) // private userFollowerRepo: Repository<UserFollowerEntity>,
  ) {}

  async healthCheck(userId: string) {
    await this.userRepo.update({ id: userId }, { last_activity: new Date() });
  }

  /**
   * COMMON
   */

  async getUserById(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

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

  async createUser(email: string, username: string, image: string): Promise<UserEntity> {
    const user = this.userRepo.create({ email, avatar: image, username });
    return this.userRepo.save(user);
  }

  async findByEmail(email: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({
      where: { email },
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

  // async checkIfUserHasConversation(userId: string, friendId: string) {
  //   const thisUser = await this.userRepo
  //     .createQueryBuilder('users')
  //     .leftJoinAndSelect('users.conversations', 'conversations')
  //     .leftJoinAndSelect('conversations.members', 'members')
  //     .where('users.id =:id', { id: userId })
  //     .getOne();

  //   const exist = thisUser?.conversations.some((conversation) => {
  //     return conversation.members.map((member) => member.id).includes(friendId);
  //   });

  //   if (exist) {
  //     return false;
  //   }
  //   const friend = await this.getUserById(friendId);
  //   return friend;
  // }

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

  getFriendRequest(creatorId: string, receiverId: string) {
    return this.friendRequestRepo.findOne({
      where: [
        { creator: creatorId, receiver: receiverId },
        { creator: receiverId, receiver: creatorId },
      ],
    });
  }

  async getFriends(userId: string) {
    const friendRequestPayload = await this.friendRequestRepo.find({
      where: [
        { creator: userId, status: FriendRequestStatus.ACCEPTED },
        { receiver: userId, status: FriendRequestStatus.ACCEPTED },
      ],
      relations: ['creator', 'receiver'],
    });

    const friends = friendRequestPayload.map((friend) => {
      if (friend.creator.id === userId) {
        return friend.receiver;
      }
      return friend.creator;
    });
    return friends;
  }

  getFriendRequests(userId: string): Promise<FriendRequestEntity[]> {
    return this.friendRequestRepo.find({ where: [{ receiver: userId }] });
  }

  async sendFriendRequest(userId: string, friendId: string) {
    if (userId == friendId) {
      throw new BadRequestException('Không thể kết bạn với bản thân !');
    }

    const frq = await this.getFriendRequest(userId, friendId);
    if (frq) {
      throw new BadRequestException('Bạn đã gửi yêu cầu kết bạn');
    }

    const user = await this.getUserById(userId);
    const friend = await this.getUserById(friendId);
    return this.friendRequestRepo.save({ creator: user, receiver: friend, status: FriendRequestStatus.PENDING });
  }

  async responseFriendRequest(userId: string, friendRequestId: string, status: FriendRequestResponse) {
    const frq = await this.friendRequestRepo.findOne({
      where: { id: friendRequestId, receiver: userId },
      relations: ['creator', 'receiver'],
    });
    if (!frq) {
      throw new BadRequestException('Không tìm thấy yêu cầu kết bạn');
    }
    if (frq.status === FriendRequestStatus.ACCEPTED) {
      throw new BadRequestException('Yêu cầu kết bạn đã được chấp nhận');
    }

    if (status === FriendRequestResponse.REJECTED) {
      frq.status = FriendRequestStatus.ACCEPTED;

      await this.friendRequestRepo.delete(frq);
      return;
    }

    frq.status = FriendRequestStatus.ACCEPTED;
    return this.friendRequestRepo.save(frq);
  }

  async deleteFriend(userId: string, friendId: string) {
    const friendRequest = await this.getFriendRequest(userId, friendId);
    if (!friendRequest) {
      throw new BadRequestException('Không tìm thấy yêu cầu kết bạn');
    }
    return this.friendRequestRepo.delete(friendRequest);
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

  async updateProfile(userId: string, profile: UserInfo): Promise<UserEntity> {
    let user = await this.getUserById(userId);

    for (var key in profile) {
      if (profile[key] !== null && profile[key] !== undefined) {
        user[key] = profile[key];
      }
    }
    return this.userRepo.save(user);
  }

  // Change password
  async changePassword(userId: string, { oldPassword, newPassword }: ChangePasswordDto) {
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (this.isMatchPassword(oldPassword, user.password)) {
        user.password = hashPassword(newPassword);
      } else {
        throw new Error('Mật khẩu cũ không đúng');
      }
      await this.userRepo.save(user);
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException(error.message);
    }
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
