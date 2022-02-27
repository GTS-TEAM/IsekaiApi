import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { reverseConversationId } from '../common/utils/reverse-conversation-id';
import { UserEntity } from '../user/user';
import { ConversationEntity } from './entities/conversation';
import { MessageEntity } from './entities/message';
import * as utils from '../common/utils/generate-id';
import { ConversationType, MessageType } from '../common/constants/enum';
import { AnErrorOccuredException, ConversationNotFoundException, MemberNotFoundException } from '../common/error/error.dto';
import { IConversationFields } from '../interfaces/conversation-field.interface';
import { IPage } from '../interfaces/page.interface';
import { MemberEntity } from './entities/member';

@Injectable()
export class ConversationService {
  private logger = new Logger(ConversationService.name);
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationRepo: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepo: Repository<MessageEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberRepo: Repository<MemberEntity>,
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
        .leftJoinAndSelect('conversations.last_message', 'last_message')
        .leftJoinAndSelect('conversations.members', 'members')
        .leftJoinAndSelect('last_message.sender', 'last_message_sender')
        .leftJoinAndSelect('members.user', 'users')
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
      relations: ['members', 'last_message'],
    });
  }

  async getUserConversations(userId: string, page?: IPage): Promise<ConversationEntity[]> {
    try {
      const queryB = this.conversationRepo
        .createQueryBuilder('conversations')
        .leftJoinAndSelect('conversations.members', 'members')
        .leftJoin('members.user', 'users')
        .where('users.id = :id', { id: userId })
        .leftJoinAndSelect('conversations.members', 'all_users')
        .leftJoinAndSelect('conversations.last_message', 'last_message')
        .leftJoinAndSelect('last_message.sender', 'last_message_sender');
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
      const member1 = this.memberRepo.create({ user: user1 });
      const member2 = this.memberRepo.create({ user: user2 });

      const members = await this.memberRepo.save([member1, member2]);

      const conversation = this.conversationRepo.create({
        id: user1.id + '-' + user2.id,
        members: members,
      });
      await this.conversationRepo.save(conversation);
      return conversation;
    } catch (error) {
      this.logger.error(error);
      throw new AnErrorOccuredException(error.message);
    }
  }

  async createGroupConversation(creator: UserEntity, users: UserEntity[]): Promise<MessageEntity[]> {
    try {
      const creatorMember = this.memberRepo.create({ user: creator });
      const membersEntity = users.map((u) => this.memberRepo.create({ user: u }));
      const members = await this.memberRepo.save([creatorMember, ...membersEntity]);

      const conversation = this.conversationRepo.create({
        id: utils.generateId(11),
        type: ConversationType.GROUP,
        members: [creatorMember, ...membersEntity],
      });

      const converSnapshot = await this.conversationRepo.save(conversation);

      const messages: MessageEntity[] = [];

      const message = this.messageRepo.create({
        content: `${creator.username} đã tạo cuộc trò chuyện`,
        type: MessageType.SYSTEM,
        conversation,
      });

      messages.push(message);

      members.forEach(async (u) => {
        if (u.id !== creatorMember.id) {
          const m = this.messageRepo.create({
            content: `${creator.username} đã thêm ${u.user.username} vào cuộc trò chuyện`,
            type: MessageType.SYSTEM,
            conversation: converSnapshot,
          });
          messages.push(m);
        }
      });

      const m = await this.messageRepo.save(messages);

      // add last message to conversation
      conversation.last_message = m[m.length - 1];
      await this.conversationRepo.save(conversation);

      return m;
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

      const members = conversation.members.filter((m) => m.user.id !== user.id);

      if (members.length === 0) {
        await this.conversationRepo.delete({ id: conversationId });
      } else {
        conversation.members = members;
        await this.conversationRepo.save(conversation);
      }
      // add last message to conversation
      const m = await this.messageRepo.save(message);
      conversation.last_message = m;

      return;
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
      const conversation = await this.conversationRepo.findOne({ where: { id: conversationId } });
      if (!conversation) {
        throw new ConversationNotFoundException();
      }
      let MESS = '';

      if (fields.name) {
        MESS = `${user.username} đã đổi tên cuộc trò chuyện thành ${fields.name}`;
        conversation.name = fields.name;
      } else if (fields.avatar) {
        conversation.avatar = fields.avatar;
        MESS = `${user.username} đã đổi ảnh đại diện cuộc trò chuyện`;
      } else if (fields.theme) {
        conversation.theme = fields.theme;
        MESS = `${user.username} đã đổi chủ đề cuộc trò chuyện thành ${fields.theme}`;
      }

      const message = this.messageRepo.create({
        content: MESS,
        type: MessageType.SYSTEM,
        conversation,
      });

      const m = await this.messageRepo.save(message);
      conversation.last_message = m;
      await this.conversationRepo.save(conversation);

      return m;
    } catch (error) {
      this.logger.error(error);
      throw new AnErrorOccuredException(error.message);
    }
  }

  async addMembersToGroupConversation(
    user: UserEntity,
    conversationId: string,
    users: UserEntity[],
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

      users.forEach(async (member) => {
        const message = this.messageRepo.create({
          content: `${user.username} đã thêm ${member.username} vào cuộc trò chuyện`,
          type: MessageType.SYSTEM,
          conversation,
        });
        messages.push(message);
      });

      const members = users.map((m) => this.memberRepo.create({ user: m }));

      const membersAdded = conversation.members.concat(members);

      conversation.members = membersAdded;
      const ms = await this.messageRepo.save(messages);
      conversation.last_message = ms[ms.length - 1];
      await this.conversationRepo.save(conversation);

      return ms;
    } catch (error) {
      this.logger.error(error);
      throw new AnErrorOccuredException(error.message);
    }
  }
  async getMessages(userId: string, conversationId: string, page: IPage): Promise<MessageEntity[]> {
    const member = await this.findMember(userId, conversationId);

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
      const m = await this.messageRepo.save(message);
      await this.conversationRepo.update({ id: conversationId }, { type: ConversationType.DELETED, last_message: m });
      return m;
    } catch (error) {
      this.logger.error(error);
      throw new AnErrorOccuredException(error.message);
    }
  }

  async createMessage(
    conversationId: string,
    content: string,
    senderId: string,
    type?: MessageType,
  ): Promise<MessageEntity> {
    try {
      const conversation = await this.conversationRepo.findOne({
        where: { id: conversationId },
        relations: ['members'],
      });

      const sender = await this.findMember(senderId, conversationId);
      const messageEntity = this.messageRepo.create({
        content,
        sender,
        conversation,
      });

      if (type) {
        messageEntity.type = type;
      }

      const m = await this.messageRepo.save(messageEntity);
      conversation.last_message = m;
      await this.conversationRepo.save(conversation);
      return m;
    } catch (error) {
      this.logger.error(error + '\n' + error.stack);
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

      const isJoined = conversation.members.find((m) => m.user.id === user1.id);
      if (!isJoined) {
        throw new Error('Người dùng chưa tham gia cuộc trò chuyện');
      }

      conversation.members = conversation.members.filter((m) => m.user.id !== user1.id);
      const messageEntity = this.messageRepo.create({
        content: MESS,
        type: MessageType.SYSTEM,
        conversation,
      });
      const m = await this.messageRepo.save(messageEntity);
      conversation.last_message = m;
      await this.conversationRepo.save(conversation);
      return m;
    } catch (error) {
      this.logger.error(error);
      throw new AnErrorOccuredException(error.message);
    }
  }

  async deleteConversation(userId: string, conversationId: string) {
    try {
      const member = await this.findMember(userId, conversationId);

      member.deleted_conversation_at = new Date();

      await this.memberRepo.save(member);
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

  async findMember(userId: string, conversationId: string): Promise<MemberEntity> {
    const member = await this.memberRepo
      .createQueryBuilder('members')
      .where('members.user_id = :userId', { userId })
      .andWhere('members.conversation_id = :conversationId', { conversationId })
      .leftJoinAndSelect('members.user', 'user')
      .getOne();
    if (!member) {
      throw new MemberNotFoundException();
    }
    return member;
  }
}
