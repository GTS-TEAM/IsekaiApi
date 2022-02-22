import { MessageEntity } from 'src/conversation/entities/message';
import { UserEntity } from 'src/user/user';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AbstractEntity } from '../../common/abstract.entity';
import { ConversationType } from '../../common/constants/enum';

@Entity('conversations')
export class ConversationEntity {
  @PrimaryColumn()
  id: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ enum: ConversationType, default: ConversationType.PRIVATE })
  type: ConversationType;

  @ManyToMany((type) => UserEntity)
  @JoinTable()
  members: UserEntity[];

  @OneToMany((type) => MessageEntity, (message) => message.conversation, {
    cascade: true,
  })
  messages: MessageEntity[];

  @Column({ nullable: true })
  last_message: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
