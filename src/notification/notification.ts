import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NotiStatus, NotiType } from '../common/constants/enum';
import { UserEntity } from '../user/user';

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToMany(() => UserEntity, (user) => user.notifications)
  @JoinTable()
  senders: UserEntity[];

  @ManyToOne(() => UserEntity, (user) => user.notifications)
  receiver: UserEntity;

  @ApiProperty()
  @Column({ type: 'enum', enum: NotiStatus, default: NotiStatus.PENDING })
  status: NotiStatus;

  @ApiProperty({ type: 'enum', enum: NotiType })
  @Column()
  type: NotiType;

  @ApiProperty()
  @Column({ nullable: true })
  refId: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
