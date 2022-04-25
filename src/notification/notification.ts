import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../common/abstract.entity';
import { NotiStatus, NotiType } from '../common/constants/enum';
import { UserEntity } from '../user/user';

@Entity('notifications')
export class NotificationEntity extends AbstractEntity {
  @ManyToMany(() => UserEntity, (user) => user.notifications)
  @JoinTable()
  senders: UserEntity[];

  @ManyToOne(() => UserEntity, (user) => user.notifications)
  receiver: UserEntity;

  @ApiProperty()
  @Column({ default: false })
  is_read: boolean;

  @ApiProperty({ type: 'enum', enum: NotiType })
  @Column()
  type: NotiType;

  @ApiProperty()
  @Column({ nullable: true })
  refId: string;
}
