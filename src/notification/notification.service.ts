import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotiStatus, NotiType } from '../shared/constants/enum';
import { UserEntity } from '../user/user';
import { NotificationEntity } from './notification';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity) private notifRepo: Repository<NotificationEntity>,
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
  ) {}

  async getUserNotifications(userId: string) {
    return await this.notifRepo.find({ where: { to: userId } });
  }

  async sendNotification(userId: string, friendId: string, notif: { type: NotiType; status: NotiStatus }) {
    const notifEntity = this.notifRepo.create(notif);
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const friend = await this.userRepo.findOne({ where: { id: friendId } });
    notifEntity.users;
    notifEntity.to = user;
    return await this.notifRepo.save(notifEntity);
  }
}
