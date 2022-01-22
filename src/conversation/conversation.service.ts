// import { BadRequestException, Injectable, Logger } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { RedisCacheService } from 'src/shared/redis-cache/redis-cache.service';
// import { UserEntity } from 'src/user/user';
// import { In, Like, Repository } from 'typeorm';
// import { ConversationEntity } from './entity/conversation';

// @Injectable()
// export class ConversationService {
//   private logger = new Logger(ConversationService.name);
//   constructor(
//     @InjectRepository(ConversationEntity)
//     private readonly conversationRepo: Repository<ConversationEntity>,
//     @InjectRepository(MessageEntity)
//     private readonly messageRepo: Repository<MessageEntity>,
//     @InjectRepository(UserEntity)
//     private readonly userRepo: Repository<UserEntity>,
//     private readonly redisCacheService: RedisCacheService,
//   ) {}

// async getConversations(user: UserEntity): Promise<ConversationEntity[]> {
//   const thisUser = await this.userRepo.findOne({
//     where: { id: user.id },
//     relations: ['conversations'],
//   });

//   const conversations = await this.conversationRepo.find({
//     where: {
//       id: In(thisUser.conversations.map((c) => c.id)),
//     },
//     relations: ['members'],
//   });

//   return conversations;
// }

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

// async createConversation(members: UserEntity[]): Promise<ConversationEntity> {
//   try {
//     const conversation = this.conversationRepo.create({
//       members,
//     });
//     return await this.conversationRepo.save(conversation);
//   } catch (error) {
//     this.logger.error(error);
//   }
// }

// async getMessages(conversationId: string): Promise<MessageEntity[]> {
//   // get messages of conversation by conversation id
//   const messages = await this.messageRepo
//     .createQueryBuilder('messages')
//     .leftJoinAndSelect('messages.conversation', 'conversations')
//     .leftJoinAndSelect('messages.sender', 'users')
//     .select([
//       'users.id',
//       'users.username',
//       'users.profilePicture',
//       'messages.id',
//       'messages.content',
//       'messages.created_at',
//     ])
//     .andWhere('conversations.id = :conversationId', { conversationId })
//     .getMany();
//   return messages;
// }

// async createMessage(conversationId: string, content: string, senderId: string): Promise<MessageEntity> {
//   try {
//     const conversation = await this.conversationRepo.findOne({
//       where: { id: conversationId },
//     });
//     const sender = await this.userRepo.findOne({ where: { id: senderId } });
//     const messageEntity = this.messageRepo.create({
//       content,
//       sender,
//       conversation,
//     });

//     const message = await this.messageRepo.save(messageEntity);
//     await this.redisCacheService.setToRedis('message' + conversationId, async () => {
//       return message;
//     });
//     return message;
//   } catch (error) {
//     this.logger.error(error);
//   }
// }
// }
