import { MessageEntity } from 'src/conversation/entities/message';
import { UserEntity } from 'src/user/user';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AbstractEntity } from '../../common/abstract.entity';
import { ConversationType } from '../../common/constants/enum';
import { FileEntity } from './file';
import { MemberEntity } from './member';
import { SeenEntity } from './seen';

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

  @OneToMany((type) => MemberEntity, (member) => member.conversations, {
    onDelete: 'CASCADE',
  })
  members: MemberEntity[];

  @OneToMany((type) => MessageEntity, (message) => message.conversation, {
    cascade: true,
  })
  messages: MessageEntity[];

  @OneToOne(() => MessageEntity)
  @JoinColumn()
  last_message: MessageEntity;

  @ManyToMany((type) => UserEntity)
  @JoinTable({ name: 'users_deleted' })
  users_deleted: UserEntity[];

  @OneToMany((type) => SeenEntity, (seen) => seen.conversation, { eager: true, cascade: true })
  seen: SeenEntity;

  // TODO: Check performance
  // @OneToMany((type) => FileEntity, (file) => file.conversation)
  // files: FileEntity[];
  @Column({ nullable: true })
  theme: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
