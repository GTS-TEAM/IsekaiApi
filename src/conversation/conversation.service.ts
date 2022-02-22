import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Not, Repository } from 'typeorm';
import { reverseConversationId } from '../common/utils/reverse-conversation-id';
import { UserEntity } from '../user/user';
import { ConversationEntity } from './entities/conversation';
import { MessageEntity } from './entities/message';
import * as utils from '../common/utils/generate-id';
import { ConversationType, MessageType } from '../common/constants/enum';

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

  // async getConversation(conversationId: string): Promise<ConversationEntity> {
  //   try {
  //     return await this.conversationRepo
  //       .createQueryBuilder('conversations')
  //       .innerJoin('conversations.members', 'members')
  //       .getOne();
  //   } catch (error) {
  //     this.logger.error(error);
  //   }
  // }
  async getPrivateConversation(userId: string, targetId: string) {
    try {
      /**
       * ('conversations.id = :id', { id: `${userId}-${targetId}` })
        .orWhere('conversations.id = :id', { id: `${targetId}-${userId}` })
       */
      const ids = [`${userId}-${targetId}`, `${targetId}-${userId}`];
      const conversation = await this.conversationRepo
        .createQueryBuilder('conversations')
        .whereInIds(ids)
        .leftJoinAndSelect('conversations.members', 'members')
        // .andWhere('conversations.type = :type', { type: ConversationType.PRIVATE })
        // .leftJoinAndSelect('conversations.members', 'all_users')
        .orderBy('conversations.updated_at', 'DESC')
        .getOne();
      return conversation;
    } catch (error) {
      this.logger.error(error);
    }
  }

  async getGroupConversation(id: string) {
    return await this.conversationRepo.findOne({
      where: { id },
      relations: ['members'],
    });
  }

  async getUserConversations(userId: string, limit?: number, offset?: number) {
    try {
      const converQ = this.conversationRepo
        .createQueryBuilder('conversations')
        .leftJoin('conversations.members', 'members')
        .where('members.id = :id', { id: userId })
        .leftJoinAndSelect('conversations.members', 'all_users')
        .orderBy('conversations.updated_at', 'DESC')
        .getMany();

      const conversations = await converQ;

      return conversations;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException("Can't get user conversations", error.message);
    }
  }

  async createConversation(members: UserEntity[]): Promise<ConversationEntity> {
    try {
      const conversation = this.conversationRepo.create({
        id: members.map((m) => m.id).join('-'),
        members,
      });
      await this.conversationRepo.save(conversation);
      return conversation;
    } catch (error) {
      this.logger.error(error);
    }
  }

  async createGroupConversation(creator: UserEntity, members: UserEntity[]) {
    try {
      const conversation = this.conversationRepo.create({
        id: utils.generateId({ size: 11, constraint: 0 }),
        last_message: `${creator.username} created a group`,
        type: ConversationType.GROUP,
        members: [creator, ...members],
      });
      const message = this.messageRepo.create({
        content: `${creator.username} created a group`,
        type: MessageType.SYSTEM,
        conversation,
      });

      await this.conversationRepo.save(conversation);
      return await this.messageRepo.save(message);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async getMessages(conversationId: string, limit: number, offset: number): Promise<MessageEntity[]> {
    // get messages of conversation by conversation id
    // conversationId.split('-').reduce((id1, id2) => {
    //   return id1 + '-' + id2;
    // });
    // const converIdReverse = reverseConversationId(conversationId);
    const messages = await this.messageRepo
      .createQueryBuilder('messages')
      .limit(limit)
      .offset(offset)
      .orderBy('messages.created_at', 'DESC')
      .leftJoin('messages.conversation', 'conversation')
      .where('conversation.id = :conversationId', { conversationId })
      .leftJoinAndSelect('messages.sender', 'users')
      .select(['users.id', 'users.username', 'users.avatar', 'messages.id', 'messages.content', 'messages.created_at'])
      .getMany();
    // const messages = await this.messageRepo
    //   .createQueryBuilder('messages')
    //   .limit(limit)
    //   .offset(offset)
    //   .orderBy('messages.created_at', 'DESC')
    //   .andWhere('conversation.id = :conversationId', { conversationId })
    //   .orWhere('conversation.id = :conversationId', { conversationId: converIdReverse })
    //   .leftJoinAndSelect('messages.conversation', 'conversation')
    //   .leftJoinAndSelect('messages.sender', 'users')
    //   .select(['users.id', 'users.username', 'users.avatar', 'messages.id', 'messages.content', 'messages.created_at'])
    //   .getMany();
    return messages;
  }

  async createMessage(conversationId: string, content: string, senderId: string): Promise<MessageEntity> {
    try {
      const conversation = await this.conversationRepo.findOne({
        where: { id: conversationId },
      });
      conversation.last_message = content;

      const sender = await this.userRepo.findOne({ where: { id: senderId } });

      const messageEntity = this.messageRepo.create({
        content,
        sender,
        conversation,
      });
      this.conversationRepo.save(conversation);
      return await this.messageRepo.save(messageEntity);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async addUserToGroupConversation(id: string, user: UserEntity, user1: UserEntity) {
    try {
      const conversation = await this.getGroupConversation(id);

      if (!conversation) {
        throw new BadRequestException('Conversation not found');
      }
      conversation.members.forEach((member) => {
        this.logger.log(JSON.stringify(member));
      });
      const isJoined = conversation.members.find((m) => m.id === user1.id);
      if (isJoined) {
        throw new Error('User already joined');
      }
      conversation.members.push(user);
      conversation.last_message = `${user.username} added ${user1.username} to the group`;
      const messageEntity = this.messageRepo.create({
        content: `${user.username} added ${user1.username} to the group`,
        type: MessageType.SYSTEM,
        conversation,
      });
      await this.conversationRepo.save(conversation);
      return await this.messageRepo.save(messageEntity);
    } catch (error) {
      this.logger.error(error);
      throw new Error(error);
    }
  }
}
