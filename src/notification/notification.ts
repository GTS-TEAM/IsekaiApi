import { ApiProperty } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { NotiStatus, NotiType } from '../shared/constants/enum';
import { UserEntity } from '../user/user';

@Entity('notifications')
export class NotificationEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToMany(() => UserEntity, (user) => user.notifications)
  users: UserEntity[];

  @ManyToOne(() => UserEntity, (user) => user.notifications)
  to: UserEntity;

  @ApiProperty()
  @Column({ type: 'enum', enum: NotiStatus, default: NotiStatus.PENDING })
  status: NotiStatus;

  @ApiProperty({ type: 'enum', enum: NotiType })
  @Column()
  type: NotiType;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
