import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostEntity } from '../post/entities/post';
import { NotiStatus, NotiType } from '../common/constants/enum';
import { UserEntity } from '../user/user';
import { NotificationRequestDto } from './dto/notif-request.dto';
import { NotificationEntity } from './notification';

@Injectable()
export class NotificationService {
  private logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(NotificationEntity) private notifRepo: Repository<NotificationEntity>,
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
    @InjectRepository(PostEntity) private postRepo: Repository<PostEntity>,
  ) {}

  async getUserNotifications(userId: string) {
    return await this.notifRepo.find({
      where: { receiver: userId },
      select: ['id', 'status', 'type', 'updated_at'],
    });
  }

  /**
   * Friend request
   */
  async getUserFriendRequests(userId: string) {
    return await this.notifRepo.find({
      where: {
        receiver: userId,
        type: NotiType.FRIEND_REQUEST,
        status: NotiStatus.PENDING,
      },
    });
  }

  async sendFriendRequest(userId: string, notif: NotificationRequestDto) {
    try {
      const user = await this.userRepo.findOne(userId);
      const receiver = await this.userRepo.findOne(notif.refId);
      const notifEntity = this.notifRepo.create();
      notifEntity.receiver = receiver;
      notifEntity.type = notif.type;
      notifEntity.senders = [user];
      notifEntity.status = NotiStatus.PENDING;
      return this.notifRepo.save(notifEntity);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Có lỗi xảy ra vui lòng thử lại sau', error.message);
    }
  }

  async getFriendRelaStatus(userId: string, friendId: string) {
    try {
      let req = null;
      const userRequest = await this.notifRepo
        .createQueryBuilder('noti')
        .leftJoin('noti.senders', 'senders')
        .where('senders.id =:id', { id: userId })
        .leftJoin('noti.receiver', 'receiver')
        .where('receiver.id =:id', { id: friendId })
        .getOne();
      if (userRequest) {
        req = {
          type: userRequest.type,
          id: userRequest.id,
        };
      }
      const friendRequest = await this.notifRepo
        .createQueryBuilder('noti')
        .leftJoin('noti.senders', 'senders')
        .where('senders.id =:id', { id: friendId })
        .leftJoin('noti.receiver', 'receiver')
        .where('receiver.id =:id', { id: userId })
        .getOne();
      if (friendRequest) {
        req = {
          type: friendRequest.type,
          id: friendRequest.id,
        };
      }
      return req;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Có lỗi xảy ra vui lòng thử lại sau', error.message);
    }
  }

  async sendNotification(userId: string, notif: NotificationRequestDto) {
    try {
      //TODO: Optimize this
      const notifEntity = this.notifRepo.create(notif);
      const user = await this.userRepo.findOne({ where: { id: userId } });
      const post = await this.postRepo.findOne({ where: { id: notif.refId }, relations: ['users'] });
      notifEntity.senders.push(post.user);
      notifEntity.receiver = user;
      return await this.notifRepo.save(notifEntity);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Có lỗi xảy ra vui lòng thử lại sau', error.message);
    }
  }

  async readNotification(userId: string, notifId: string) {
    try {
      const notif = await this.notifRepo.findOne({
        where: { id: notifId },
        relations: ['receiver'],
      });
      if (notif.receiver.id === userId) {
        notif.status = NotiStatus.READ;
        return await this.notifRepo.save(notif);
      }
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Có lỗi xảy ra vui lòng thử lại sau', error.message);
    }
  }
}
