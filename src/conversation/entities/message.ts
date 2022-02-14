import { ConversationEntity } from 'src/conversation/entities/conversation';
import { UserEntity } from 'src/user/user';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AbstractEntity } from '../../common/abstract.entity';

@Entity('messages')
export class MessageEntity extends AbstractEntity {
  @ManyToOne((type) => ConversationEntity, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  conversation: ConversationEntity;

  @ManyToOne((type) => UserEntity, (user) => user.messages)
  sender: UserEntity;

  @Column()
  content: string;
}
