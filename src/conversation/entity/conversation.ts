import { MessageEntity } from 'src/conversation/entity/message';
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

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
