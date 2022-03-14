import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FileType, MessageType } from 'src/common/constants/enum';
import { reverseConversationId } from 'src/common/utils/reverse-conversation-id';
import { AnErrorOccuredException } from 'src/error/error.dto';
import { IPage } from 'src/interfaces/page.interface';
import { UserEntity } from 'src/user/user';
import { DeepPartial, Repository } from 'typeorm';
import { ConversationEntity } from '../entities/conversation';
import { FileEntity } from '../entities/file';
import { MessageEntity } from '../entities/message';
import { MemberService } from './member.service';

@Injectable()
export class MessageService {
  private logger = new Logger(MessageService.name);

  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepo: Repository<MessageEntity>,
    private readonly memberService: MemberService,
  ) {}

  async getMessages(userId: string, conversationId: string, page: IPage): Promise<MessageEntity[]> {
    const member = await this.memberService.findMember(userId, conversationId);

    const query = this.messageRepo
      .createQueryBuilder('messages')
      .limit(page.limit)
      .offset(page.offset)
      .orderBy('messages.created_at', 'DESC')
      .leftJoin('messages.conversation', 'conversation')
      .where('conversation.id = :conversationId', { conversationId })
      .leftJoinAndSelect('messages.sender', 'member')
      .leftJoinAndSelect('messages.files', 'files');

    if (member.deleted_conversation_at) {
      query.andWhere('messages.created_at >= :created', { created: member.deleted_conversation_at });
    }
    return await query.leftJoinAndSelect('member.user', 'user').getMany();
  }

  async create(entityLike: DeepPartial<MessageEntity>): Promise<MessageEntity> {
    const message = this.messageRepo.create(entityLike);
    return this.messageRepo.save(message);
  }

  async deleteAllMessages() {
    try {
      await this.messageRepo.delete({});
    } catch (error) {
      this.logger.error(error);
      throw new AnErrorOccuredException(error.message);
    }
  }

  /**
   *
   * @param creator The user who created the message
   * @param membersName The name of the members of the conversation (not the user)
   * @param conversationSnapshot The conversation snapshot
   * @returns
   */
  async generateCreateGroup(
    creator: UserEntity,
    membersName: string[],
    conversationSnapshot: ConversationEntity,
  ): Promise<MessageEntity[]> {
    const message = await this.create({
      content: `${creator.username} đã tạo cuộc trò chuyện`,
      type: MessageType.SYSTEM,
      conversation: conversationSnapshot,
    });
    await this.messageRepo.save(message);

    return await this.generateAddMembers(creator, membersName, conversationSnapshot);
  }

  async generateAddMembers(creator: UserEntity, membersName: string[], conversationSnapshot: ConversationEntity) {
    const messages = membersName.map((name) => {
      return this.messageRepo.create({
        content: `${creator.username} đã thêm ${name} vào cuộc trò chuyện`,
        type: MessageType.SYSTEM,
        conversation: conversationSnapshot,
      });
    });
    return this.messageRepo.save(messages);
  }

  async getMessagesByCombineId(userId: string, receiver_id: string, page: IPage): Promise<MessageEntity[]> {
    const conversationId = userId + '-' + receiver_id;
    this.logger.log(conversationId);
    const converIdReverse = reverseConversationId(conversationId);
    this.logger.log(converIdReverse);

    return await this.messageRepo
      .createQueryBuilder('messages')
      .limit(page.limit)
      .offset(page.offset)
      .orderBy('messages.created_at', 'DESC')
      .leftJoinAndSelect('messages.conversation', 'conversation')
      .where('conversation.id = :conversationId', { conversationId })
      .orWhere('conversation.id = :id', { id: converIdReverse })
      .leftJoinAndSelect('messages.sender', 'member')
      .leftJoinAndSelect('member.user', 'user')
      .leftJoinAndSelect('messages.files', 'files')
      .getMany();
  }

  async getFilesInMessage(conversationId: string, page: IPage, types: FileType[]): Promise<FileEntity[]> {
    const messages = await this.messageRepo
      .createQueryBuilder('messages')
      .limit(page.limit)
      .offset(page.offset)
      .orderBy('messages.created_at', 'DESC')
      .leftJoin('messages.conversation', 'conversation')
      .where('conversation.id = :conversationId', { conversationId })
      .leftJoinAndSelect('messages.files', 'files')
      .andWhere('files.type IN (:...types)', { types })
      .getMany();

    // const messages = await qb.getMany();
    return messages.map((m) => m.files).flat();
  }
}
