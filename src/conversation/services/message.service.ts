import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageType } from 'src/common/constants/enum';
import { reverseConversationId } from 'src/common/utils/reverse-conversation-id';
import { AnErrorOccuredException } from 'src/error/error.dto';
import { IPage } from 'src/interfaces/page.interface';
import { UserEntity } from 'src/user/user';
import { DeepPartial, Repository } from 'typeorm';
import { ConversationEntity } from './entities/conversation';
import { MemberEntity } from './entities/member';
import { MessageEntity } from './entities/message';
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
      .leftJoinAndSelect('messages.sender', 'member');

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

    const converIdReverse = reverseConversationId(conversationId);

    return await this.messageRepo
      .createQueryBuilder('messages')
      .limit(page.limit)
      .offset(page.offset)
      .orderBy('messages.created_at', 'DESC')
      .leftJoinAndSelect('messages.conversation', 'conversation')
      .where('conversation.id = :conversationId', { conversationId })
      .orWhere('conversation.id = :id', { id: converIdReverse })
      .leftJoinAndSelect('messages.sender', 'users')
      .select([
        'users.id',
        'users.username',
        'users.avatar',
        'messages.id',
        'messages.content',
        'messages.created_at',
        'messages.type',
      ])
      .getMany();
  }

  async getFilesInMessage(conversationId: string, page: IPage, type: MessageType): Promise<string[]> {
    const messages = await this.messageRepo
      .createQueryBuilder('messages')
      .limit(page.limit)
      .offset(page.offset)
      .orderBy('messages.created_at', 'DESC')
      .leftJoin('messages.conversation', 'conversation')
      .where('conversation.id = :conversationId', { conversationId })
      .andWhere('messages.type = :type', { type })
      .getMany();
    return messages.map((m) => m.content);
  }
}
