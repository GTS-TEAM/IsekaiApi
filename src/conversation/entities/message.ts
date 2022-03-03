import { ConversationEntity } from 'src/conversation/entities/conversation';
import { UserEntity } from 'src/user/user';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../common/abstract.entity';
import { MessageType } from '../../common/constants/enum';
import { MemberEntity } from './member';

@Entity('messages')
export class MessageEntity extends AbstractEntity {
  @ManyToOne((type) => ConversationEntity, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'conversation_id',
  })
  conversation: ConversationEntity;

  @Column({ default: MessageType.TEXT })
  type: MessageType;

  @ManyToOne((type) => MemberEntity, (m) => m.messages)
  sender: MemberEntity;

  @Column()
  content: string;
}
