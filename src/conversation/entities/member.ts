import { AbstractEntity } from 'src/common/abstract.entity';
import { MemberRole } from 'src/common/constants/enum';
import { UserEntity } from 'src/user/user';
import { Column, Entity, JoinColumn, ManyToMany, OneToOne } from 'typeorm';
import { ConversationEntity } from './conversation';

@Entity('members')
export class MemberEntity extends AbstractEntity {
  @Column({ nullable: true })
  nickname: string;

  @Column({ type: 'enum', enum: MemberRole, default: MemberRole.MEMBER })
  role: MemberRole;

  @Column({ nullable: true })
  deleted_conversation_at: Date;

  @OneToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToMany(() => ConversationEntity, (conversation) => conversation.members)
  conversations: ConversationEntity[];
}
