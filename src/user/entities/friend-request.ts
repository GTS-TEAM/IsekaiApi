import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FriendRequestStatus } from '../../common/constants/enum';
import { UserEntity } from '../user';

@Entity('request')
export class FriendRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @ManyToOne(() => UserEntity, (userEntity) => userEntity.sent_friend_requests)
  creator: UserEntity;

  @ManyToOne(() => UserEntity, (userEntity) => userEntity.received_friend_requests)
  receiver: UserEntity;

  @Column()
  status: FriendRequestStatus;
}
