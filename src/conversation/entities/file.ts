import { AbstractEntity } from 'src/common/abstract.entity';
import { FileType, MessageType } from 'src/common/constants/enum';
import { Column, Entity, ManyToOne } from 'typeorm';
import { ConversationEntity } from './conversation';
import { MessageEntity } from './message';

@Entity('files')
export class FileEntity extends AbstractEntity {
  @Column()
  link: string;

  @Column()
  name: string;

  @Column({ enum: FileType })
  type: FileType;

  //   @ManyToOne((type) => ConversationEntity, (conversation) => conversation.files)
  //   conversation: ConversationEntity;

  @ManyToOne((type) => MessageEntity, (message) => message.files)
  message: MessageEntity;
}
