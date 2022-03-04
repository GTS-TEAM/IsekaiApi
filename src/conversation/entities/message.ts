import { ConversationEntity } from 'src/conversation/entities/conversation';
import { UserEntity } from 'src/user/user';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../common/abstract.entity';
import { MessageType } from '../../common/constants/enum';
import { FileEntity } from './file';
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

  @OneToMany((type) => FileEntity, (file) => file.message, { eager: true })
  files: FileEntity[];
}
