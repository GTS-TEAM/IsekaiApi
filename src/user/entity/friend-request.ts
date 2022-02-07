import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FriendRequestStatus } from '../../shared/constants/enum';
import { UserEntity } from '../user';

@Entity('request')
export class FriendRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @ManyToOne(() => UserEntity, (userEntity) => userEntity.sentFriendRequests)
  creator: UserEntity;

  @ManyToOne(() => UserEntity, (userEntity) => userEntity.receivedFriendRequests)
  receiver: UserEntity;

  @Column()
  status: FriendRequestStatus;
}
