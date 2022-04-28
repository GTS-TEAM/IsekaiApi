import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AbstractEntity } from '../../common/abstract.entity';
import { FriendRequestStatus } from '../../common/constants/enum';
import { UserEntity } from '../user';

@Entity('request')
export class FriendRequestEntity extends AbstractEntity {
  @ManyToOne(() => UserEntity, (userEntity) => userEntity.sent_friend_requests)
  creator: UserEntity;

  @ManyToOne(() => UserEntity, (userEntity) => userEntity.received_friend_requests)
  receiver: UserEntity;

  @Column()
  status: FriendRequestStatus;
}
