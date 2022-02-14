import { MessageEntity } from 'src/conversation/entities/message';
import { UserEntity } from 'src/user/user';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AbstractEntity } from '../../common/abstract.entity';
import { ConversationType } from '../../common/constants/enum';

@Entity('conversations')
export class ConversationEntity extends AbstractEntity {
  @ManyToMany((type) => UserEntity, (user) => user.conversations, {
    cascade: true,
  })
  @JoinTable()
  members: UserEntity[];

  @OneToMany((type) => MessageEntity, (message) => message.conversation)
  messages: MessageEntity[];

  @Column({ enum: ConversationType, default: ConversationType.PRIVATE })
  type: ConversationType;
}
