import { AbstractEntity } from 'src/common/abstract.entity';
import { MemberRole } from 'src/common/constants/enum';
import { UserEntity } from 'src/user/user';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ConversationEntity } from './conversation';
import { MessageEntity } from './message';

@Entity('members')
export class MemberEntity extends AbstractEntity {
  @Column({ nullable: true })
  nickname: string;

  @Column({ type: 'enum', enum: MemberRole, default: MemberRole.MEMBER })
  role: MemberRole;

  @Column({ nullable: true })
  deleted_conversation_at: Date;

  @ManyToOne(() => UserEntity, (user) => user.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => ConversationEntity, (conversation) => conversation.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversations: ConversationEntity[];

  @OneToMany(() => MessageEntity, (message) => message.sender)
  messages: MessageEntity[];
}
