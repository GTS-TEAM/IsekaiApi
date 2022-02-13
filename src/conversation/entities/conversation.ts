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
import { ConversationType } from '../../common/constants/enum';

@Entity('conversations')
export class ConversationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToMany((type) => UserEntity, (user) => user.conversations, {
    cascade: true,
  })
  @JoinTable()
  members: UserEntity[];

  @OneToMany((type) => MessageEntity, (message) => message.conversation)
  messages: MessageEntity[];

  @Column({ enum: ConversationType, default: ConversationType.PRIVATE })
  type: ConversationType;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
