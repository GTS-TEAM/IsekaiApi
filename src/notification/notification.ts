import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { NotiStatus, NotiType } from '../shared/constants/enum';
import { UserEntity } from '../user/user';

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, (user) => user.notifications)
  from: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.notifications)
  to: UserEntity;

  @Column()
  status: NotiStatus;

  @Column()
  type: NotiType;
}
