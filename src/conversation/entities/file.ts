import { AbstractEntity } from 'src/common/abstract.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { ConversationEntity } from './conversation';
import { MessageEntity } from './message';

@Entity('files')
export class FileEntity extends AbstractEntity {
  @Column()
  link: string;

  @Column()
  name: string;

  //   @ManyToOne((type) => ConversationEntity, (conversation) => conversation.files)
  //   conversation: ConversationEntity;

  @ManyToOne((type) => MessageEntity, (message) => message.files)
  message: MessageEntity;
}
