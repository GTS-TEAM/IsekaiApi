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

  async getUserNotifications(userId: string, page: number, limit: number) {
    try {
      // get user notifications and count unread
      const noti = await this.notifRepo.find({
        where: { receiver: userId },
        select: ['id', 'is_read', 'type', 'updated_at', 'refId'],
        relations: ['senders'],
        skip: (page - 1) * limit,
        take: limit,
        order: { updated_at: 'DESC' },
      });

      const count = await this.notifRepo.count({
        where: { receiver: userId, is_read: false },
      });

      const listNotiPromise = noti.map(async (item) => {
        const { content, sub_url, avatar } = await this.generateNotification(item.type, item.refId, item.senders, item.id);
        delete item.senders;
        return {
          ...item,
          content,
          ref_url: sub_url,
          avatar,
        };
      });
      return {
        notifications: await Promise.all(listNotiPromise),
        count,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Friend request
   */
  async sendFriendRequest(userId: string, notif: NotificationRequestDto) {
    try {
      const user = await this.userRepo.findOne(userId);
      const receiver = await this.userRepo.findOne(notif.refId);
      const notifEntity = this.notifRepo.create();
      notifEntity.receiver = receiver;
      notifEntity.type = notif.type;
      notifEntity.senders = [user];
      // notifEntity.status = NotiStatus.PENDING;
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

  async generateNotification(
    notifType: NotiType,
    refId: string,
    senders: UserEntity[] | UserEntity,
    notiId?: string,
  ): Promise<{ content: string; model: any; sub_url: string; avatar: string }> {
    try {
      let content = '';
      let sender_content = '';
      let sub_url = '';
      let model: any;
      let avatar = '';
      if (senders instanceof Array) {
        const names = senders.map((item) => {
          const name = item.username.split(' ');
          return name[name.length - 1];
        });
        sender_content = names.join(', ');
        avatar = senders[senders.length - 1].avatar;
      } else {
        sender_content = senders.username;
        avatar = senders.avatar;
      }

      switch (notifType) {
        case NotiType.POST_LIKE:
          model = await this.postRepo.findOne({ where: { id: refId }, relations: ['user'] });

          if (!model) {
            await this.notifRepo.delete({ id: notiId });
          }

          content = `${sender_content} đã thích bài viết của bạn`;
          sub_url = `/post/${refId}`;
          break;
        case NotiType.FRIEND_REQUEST:
          model.user = await this.userRepo.findOneOrFail(refId);
          content = `${sender_content} đã gửi yêu cầu kết bạn`;
          sub_url = `/profile/${refId}`;

          break;
        case NotiType.FRIEND_ACCEPTED:
          model = await this.userRepo.findOneOrFail(refId);
          content = `${sender_content} đã chấp nhận lời mời kết bạn`;
          sub_url = `/profile/${refId}`;
          break;
      }
      return { content, model, sub_url, avatar };
    } catch (error) {
      this.logger.error('Errpr in generate notification', error);
    }
  }

  async sendNotification(sender: UserEntity, notif: NotificationRequestDto) {
    try {
      //TODO: Optimize this

      const { content, model, sub_url, avatar } = await this.generateNotification(notif.type, notif.refId, sender);

      const notifEntity = this.notifRepo.create(notif);

      notifEntity.receiver = model.user;

      notifEntity.senders = notifEntity.senders ? notifEntity.senders : [];

      notifEntity.senders.push(sender);

      const noti = await this.notifRepo.save(notifEntity);
      return {
        type: noti.type,
        id: noti.id,
        receiver: noti.receiver,
        status: noti.is_read,
        content,
        ref_url: sub_url,
        avatar,
      };
    } catch (error) {
      this.logger.error('Error send notification', error);
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
        notif.is_read = true;
        return await this.notifRepo.save(notif);
      }
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Có lỗi xảy ra vui lòng thử lại sau', error.message);
    }
  }

  async deleteNotification(userId: string, refId: string, type: NotiType) {
    try {
      // find notification where senders is userId and refId is refId
      const notif = await this.notifRepo
        .createQueryBuilder('noti')
        .leftJoinAndSelect('noti.senders', 'senders')
        .where('senders.id =:id', { id: userId })
        .andWhere('noti.refId =:refId', { refId })
        .andWhere('noti.type =:type', { type })
        .getOne();

      if (notif) {
        if (notif.senders.length === 1) {
          await this.notifRepo.remove(notif);
        } else {
          notif.senders = notif.senders.filter((item) => item.id !== userId);
          await this.notifRepo.save(notif);
        }
      }
    } catch (error) {
      this.logger.error('Delete notification:', error);
      throw new InternalServerErrorException('Có lỗi xảy ra vui lòng thử lại sau', error.message);
    }
  }
}
