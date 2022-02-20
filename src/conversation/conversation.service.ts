import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';
import { reverseConversationId } from '../common/utils/reverse-conversation-id';
import { UserEntity } from '../user/user';
import { ConversationEntity } from './entities/conversation';
import { MessageEntity } from './entities/message';

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

  async getConversationByUsers(userId: string, targetId: string): Promise<ConversationEntity> {
    try {
      const user = await this.userRepo.findOne({
        where: { id: userId },
      });
      const target = await this.userRepo.findOne({
        where: { id: targetId },
      });
      const conversation = await this.conversationRepo.findOne({
        where: { members: In([userId, targetId]) },
      });
      if (!conversation) {
        await this.createConversation([user, target]);
      }
      return conversation;
    } catch (error) {
      this.logger.error(error);
    }
  }

  async getConversations(userId: string): Promise<ConversationEntity[]> {
    const thisUser = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['conversations'],
    });

    const conversations = await this.conversationRepo.find({
      where: {
        id: In(thisUser.conversations.map((c) => c.id)),
      },
      relations: ['members'],
    });

    return conversations;
  }

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
  async getConversation(userId: string, targetId: string) {
    try {
      const ids = [userId + '-' + targetId, targetId + '-' + userId];
      const user = await this.userRepo.findOne({
        where: { id: userId },
      });
      const target = await this.userRepo.findOne({
        where: { id: targetId },
      });
      const conversation = await this.conversationRepo.createQueryBuilder('conversations').whereInIds(ids).getOne();

      if (!conversation) {
        await this.createConversation([user, target]);
      }
      return conversation;
    } catch (error) {
      this.logger.error(error);
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

  async getMessages(conversationId: string, limit: number, offset: number): Promise<MessageEntity[]> {
    // get messages of conversation by conversation id
    conversationId.split('-').reduce((id1, id2) => {
      return id1 + '-' + id2;
    });
    const converIdReverse = reverseConversationId(conversationId);
    console.log(converIdReverse);

    const messages = await this.messageRepo
      .createQueryBuilder('messages')
      .limit(limit)
      .offset(offset)
      .orderBy('messages.created_at', 'DESC')
      .andWhere('conversation.id = :conversationId', { conversationId })
      .orWhere('conversation.id = :conversationId', { conversationId: converIdReverse })
      .leftJoinAndSelect('messages.conversation', 'conversation')
      .leftJoinAndSelect('messages.sender', 'users')
      .select(['users.id', 'users.username', 'users.avatar', 'messages.id', 'messages.content', 'messages.created_at'])
      .getMany();
    return messages;
  }

  async createMessage(conversationId: string, content: string, senderId: string): Promise<MessageEntity> {
    try {
      const conversation = await this.conversationRepo.findOne({
        where: { id: conversationId },
      });
      const sender = await this.userRepo.findOne({ where: { id: senderId } });
      const messageEntity = this.messageRepo.create({
        content,
        sender,
        conversation,
      });

      const message = await this.messageRepo.save(messageEntity);
      return message;
    } catch (error) {
      this.logger.error(error);
    }
  }
}
