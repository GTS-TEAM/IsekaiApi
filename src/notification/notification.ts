// Friend Request Entity

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { NotiStatus, NotiType } from '../shared/constants/enum';
import { UserEntity } from '../user/user';

@Entity('notifications')
export class NotitficationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  from: UserEntity;

  @Column()
  to: UserEntity;

  @Column()
  status: NotiStatus;

  @Column()
  type: NotiType;
}
