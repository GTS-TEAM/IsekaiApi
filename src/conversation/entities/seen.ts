import { AbstractEntity } from 'src/common/abstract.entity';
import { UserEntity } from 'src/user/user';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { ConversationEntity } from './conversation';

@Entity('seen')
export class SeenEntity extends AbstractEntity {
  @ManyToOne((type) => ConversationEntity, (conversation) => conversation.seen, {
    onDelete: 'CASCADE',
  })
  conversation: ConversationEntity;

  @OneToOne((type) => UserEntity)
  @JoinColumn()
  user: UserEntity;

  @Column()
  messageId: string;
}
