import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { reverseConversationId } from '../common/utils/reverse-conversation-id';
import { UserEntity } from '../user/user';
import { ConversationEntity } from './entities/conversation';
import { MessageEntity } from './entities/message';
import * as utils from '../common/utils/generate-id';
import { ConversationType, MessageType } from '../common/constants/enum';
import { AnErrorOccuredException, ConversationNotFoundException } from '../common/error/error.dto';
import { IConversationFields } from '../interfaces/conversation-field.interface';
import { IPage } from '../interfaces/page.interface';

@Injectable()
export class ConversationService {
  private logger = new Logger(ConversationService.name);
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationRepo: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepo: Repository<MessageEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  /**
   * COMMON FUNCTIONS
   */

  async getPrivateConversation(userId: string, receiverId: string): Promise<ConversationEntity> {
    try {
      const conversationId = userId + '-' + receiverId;

      const converIdReverse = reverseConversationId(conversationId);
      const conversation = await this.conversationRepo
        .createQueryBuilder('conversations')
        .where('conversations.id = :conversationId', { conversationId })
        .orWhere('conversations.id = :id', { id: converIdReverse })
        .leftJoinAndSelect('conversations.members', 'members')
        .getOne();
      return conversation;
    } catch (error) {
      this.logger.error(error);
      throw new AnErrorOccuredException(error.message);
    }
  }

  async getConversationById(id: string) {
    return await this.conversationRepo.findOne({
      where: { id },
      relations: ['members'],
    });
  }

  async getUserConversations(userId: string, page?: IPage): Promise<ConversationEntity[]> {
    try {
      const queryB = await this.conversationRepo
        .createQueryBuilder('conversations')
        .leftJoin('conversations.members', 'members')
        .where('members.id = :id', { id: userId })
        .leftJoinAndSelect('conversations.members', 'all_users');
      if (page) {
        queryB.orderBy('conversations.updated_at', 'DESC').skip(page.offset).take(page.limit);
      }
      return queryB.getMany();
    } catch (error) {
      this.logger.error(error);
      throw new AnErrorOccuredException(error.message);
    }
  }

  async createPrivateConversation(user1: UserEntity, user2: UserEntity): Promise<ConversationEntity> {
    try {
      const conversation = this.conversationRepo.create({
        id: user1.id + '-' + user2.id,
        members: [user1, user2],
      });
      await this.conversationRepo.save(conversation);
      return conversation;
    } catch (error) {
      this.logger.error(error);
      throw new AnErrorOccuredException(error.message);
    }
  }

  async createGroupConversation(creator: UserEntity, members: UserEntity[]): Promise<MessageEntity[]> {
    try {
      const last_message = `${creator.username} đã thêm ${members[members.length - 1].username} vào cuộc trò chuyện`;

      const conversation = this.conversationRepo.create({
        id: utils.generateId(11),
        type: ConversationType.GROUP,
        last_message,
        members: [creator, ...members],
      });
      const messages = [];

      const message = this.messageRepo.create({
        content: `${creator.username} đã tạo cuộc trò chuyện`,
        type: MessageType.SYSTEM,
        conversation,
      });

      messages.push(message);

      members.forEach(async (member) => {
        const m = this.messageRepo.create({
          content: `${creator.username} đã thêm ${member.username} vào cuộc trò chuyện`,
          type: MessageType.SYSTEM,
          conversation,
        });
        messages.push(m);
      });

      try {
        await this.conversationRepo.save(conversation);
      } catch (error) {
        console.log(error);
      }
      return await this.messageRepo.save(messages);
    } catch (error) {
      this.logger.error(error);
      throw new AnErrorOccuredException(error.message);
    }
  }

  async leaveGroupConversation(user: UserEntity, conversationId: string): Promise<MessageEntity> {
    try {
      const last_message = `${user.username} đã rời khỏi cuộc trò chuyện`;
      const conversation = await this.conversationRepo.findOne({
        where: { id: conversationId },
        relations: ['members'],
      });

      if (!conversation) {
        throw new ConversationNotFoundException();
      }

      const message = this.messageRepo.create({
        content: last_message,
        type: MessageType.SYSTEM,
        conversation,
      });

      const members = conversation.members.filter((m) => m.id !== user.id);

      if (members.length === 0) {
        await this.conversationRepo.delete({ id: conversationId });
      } else {
        conversation.members = members;
        conversation.last_message = last_message;
        await this.conversationRepo.save(conversation);
      }

      return await this.messageRepo.save(message);
    } catch (error) {
      throw new AnErrorOccuredException(error.message);
    }
  }

  async updateGroupConversation(
    user: UserEntity,
    conversationId: string,
    fields: IConversationFields,
  ): Promise<MessageEntity> {
    try {
      let MESS = '';

      if (fields.name) {
        MESS = `${user.username} đã đổi tên cuộc trò chuyện thành ${fields.name}`;
      } else if (fields.avatar) {
        MESS = `${user.username} đã đổi ảnh đại diện cuộc trò chuyện`;
      } else if (fields.theme) {
        MESS = `${user.username} đã đổi chủ đề cuộc trò chuyện thành ${fields.theme}`;
      }

      await this.conversationRepo.update({ id: conversationId }, fields);
      const message = this.messageRepo.create({
        content: MESS,
        type: MessageType.SYSTEM,
        conversation: await this.conversationRepo.findOne({ id: conversationId }),
      });
      return await this.messageRepo.save(message);
    } catch (error) {
      this.logger.error(error);
      throw new AnErrorOccuredException(error.message);
    }
  }

  async addMembersToGroupConversation(
    user: UserEntity,
    conversationId: string,
    members: UserEntity[],
  ): Promise<MessageEntity[]> {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: ['members'],
    });

    if (!conversation) {
      throw new ConversationNotFoundException();
    }

    try {
      const messages = [];

      members.forEach(async (member) => {
        const message = this.messageRepo.create({
          content: `${user.username} đã thêm ${member.username} vào cuộc trò chuyện`,
          type: MessageType.SYSTEM,
          conversation,
        });
        messages.push(message);
      });

      const last_message = `${user.username} đã thêm ${members[members.length - 1]} vào cuộc trò chuyện`;

      const membersAdded = conversation.members.concat(members);
      conversation.members = membersAdded;
      conversation.last_message = last_message;
      await this.conversationRepo.save(conversation);

      return await this.messageRepo.save(messages);
    } catch (error) {
      this.logger.error(error);
      throw new AnErrorOccuredException(error.message);
    }
  }
  async getMessages(conversationId: string, page: IPage): Promise<MessageEntity[]> {
    return await this.messageRepo
      .createQueryBuilder('messages')
      .limit(page.limit)
      .offset(page.offset)
      .orderBy('messages.created_at', 'DESC')
      .leftJoin('messages.conversation', 'conversation')
      .where('conversation.id = :conversationId', { conversationId })
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
  async deleteGroupConversation(user: UserEntity, conversationId: string) {
    try {
      const conversation = await this.conversationRepo.findOne({
        where: { id: conversationId },
        relations: ['members'],
      });
      if (!conversation) {
        throw new ConversationNotFoundException();
      }

      const message = this.messageRepo.create({
        content: `${user.username} đã xóa nhóm`,
        type: MessageType.SYSTEM,
        conversation,
      });

      await this.conversationRepo.update({ id: conversationId }, { type: ConversationType.DELETED });
      return await this.messageRepo.save(message);
    } catch (error) {
      this.logger.error(error);
      throw new AnErrorOccuredException(error.message);
    }
  }

  async createMessage(conversationId: string, content: string, senderId: string, type: MessageType): Promise<MessageEntity> {
    try {
      const conversation = await this.conversationRepo.findOne({
        where: { id: conversationId },
        relations: ['members'],
      });
      conversation.last_message = content;

      const sender = await this.userRepo.findOne({ where: { id: senderId } });

      const messageEntity = this.messageRepo.create({
        content,
        sender,
        conversation,
      });

      messageEntity.type = type;

      await this.conversationRepo.save(conversation);
      return await this.messageRepo.save(messageEntity);
    } catch (error) {
      this.logger.error(error);
      throw new AnErrorOccuredException(error.message);
    }
  }

  async removeUserFromGroupConversation(id: string, user: UserEntity, user1: UserEntity) {
    try {
      const conversation = await this.getConversationById(id);
      const MESS = `${user.username} đã xóa ${user1.username}`;
      if (!conversation) {
        throw new ConversationNotFoundException();
      }

      const isJoined = conversation.members.find((m) => m.id === user1.id);
      if (!isJoined) {
        throw new Error('Người dùng chưa tham gia cuộc trò chuyện');
      }

      conversation.members = conversation.members.filter((m) => m.id !== user1.id);
      conversation.last_message = MESS;
      const messageEntity = this.messageRepo.create({
        content: MESS,
        type: MessageType.SYSTEM,
        conversation,
      });
      await this.conversationRepo.save(conversation);
      return await this.messageRepo.save(messageEntity);
    } catch (error) {
      this.logger.error(error);
      throw new AnErrorOccuredException(error.message);
    }
  }

  async deleteAllConversations() {
    try {
      await this.conversationRepo.delete({});
    } catch (error) {
      this.logger.error(error);
      throw new AnErrorOccuredException(error.message);
    }
  }

  async deleteAllMessages() {
    try {
      await this.messageRepo.delete({});
    } catch (error) {
      this.logger.error(error);
      throw new AnErrorOccuredException(error.message);
    }
  }
}
