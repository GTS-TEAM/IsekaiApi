import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { reverseConversationId } from '../../common/utils/reverse-conversation-id';
import { UserEntity } from '../../user/user';
import { ConversationEntity } from '../entities/conversation';
import { MessageEntity } from '../entities/message';
import * as utils from '../../common/utils/generate-id';
import { ConversationType, MessageType } from '../../common/constants/enum';
import { AnErrorOccuredException, ConversationNotFoundException, MemberNotFoundException } from '../../error/error.dto';
import { IConversationFields } from '../../interfaces/conversation-field.interface';
import { IPage } from '../../interfaces/page.interface';
import { MemberEntity } from '../entities/member';
import { MessageService } from './message.service';
import { MemberService } from './member.service';
import { FileDto } from 'src/event/files.dto';
import { FileEntity } from '../entities/file';
import { SeenEntity } from '../entities/seen';

@Injectable()
export class ConversationService {
  private logger = new Logger(ConversationService.name);
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationRepo: Repository<ConversationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(FileEntity)
    private readonly fileRepo: Repository<FileEntity>,
    @InjectRepository(SeenEntity)
    private readonly seenRepo: Repository<SeenEntity>,
    private readonly messageService: MessageService,
    private readonly memberService: MemberService,
  ) {}

  /**
   * COMMON FUNCTIONS
   */

  async getConversationWithRelationMember(conversationId: string) {
    return this.conversationRepo
      .createQueryBuilder('conversations')
      .where('conversations.id = :id', { id: conversationId })
      .leftJoinAndSelect('conversations.members', 'members')
      .leftJoinAndSelect('members.user', 'users')
      .getOne();
  }

  async checkIfConversationExists(userId: string, receiverId: string): Promise<ConversationEntity> {
    try {
      const conversationId = userId + '-' + receiverId;
      const converIdReverse = reverseConversationId(conversationId);

      const conversation = await this.conversationRepo
        .createQueryBuilder('conversations')
        .where('conversations.id = :conversationId', { conversationId })
        .orWhere('conversations.id = :id', { id: converIdReverse })
        .leftJoinAndSelect('conversations.members', 'members')
        .leftJoinAndSelect('members.user', 'users')
        .leftJoinAndSelect('conversations.last_message', 'last_message')
        .leftJoinAndSelect('last_message.sender', 'senders')
        .leftJoinAndSelect('senders.user', 'senders_users')
        .getOne();
      return conversation;
    } catch (error) {
      this.logger.error(error);
      throw new AnErrorOccuredException(error.message);
    }
  }

  async getPrivateConversation(userId: string, receiverId: string): Promise<ConversationEntity> {
    try {
      const conversationId = userId + '-' + receiverId;
      const member = await this.memberService.findMember(userId, conversationId);
      const converIdReverse = reverseConversationId(conversationId);
      const conversation = await this.conversationRepo
        .createQueryBuilder('conversations')
        .where('conversations.id = :conversationId', { conversationId })
        .orWhere('conversations.id = :id', { id: converIdReverse })
        .andWhere('conversations.updated_at > :updated_at', { updated_at: member.deleted_conversation_at })
        .leftJoinAndSelect('conversations.last_message', 'last_message')
        .leftJoinAndSelect('conversations.members', 'members')
        .leftJoinAndSelect('last_message.sender', 'last_message_sender')
        .leftJoinAndSelect('last_message_sender.user', 'last_message_sender_user')
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
      let conversations: ConversationEntity[];
      const queryB = this.conversationRepo
        .createQueryBuilder('conversations')
        .leftJoinAndSelect('conversations.members', 'members')
        .leftJoin('members.user', 'users')
        .where('users.id = :id', { id: userId })
        .leftJoinAndSelect('conversations.members', 'all_users')
        .leftJoinAndSelect('all_users.user', 'all_users_users')
        .leftJoinAndSelect('conversations.last_message', 'last_message')
        .leftJoinAndSelect('last_message.sender', 'last_message_sender')
        .leftJoinAndSelect('last_message_sender.user', 'last_message_sender_user')
        .leftJoinAndSelect('conversations.users_deleted', 'users_deleted');
      if (page) {
        queryB.orderBy('conversations.updated_at', 'DESC').skip(page.offset).take(page.limit);
      }
      conversations = await queryB.getMany();
      if (page) {
        conversations = conversations.filter((conversation) => {
          return !conversation.users_deleted.some((u) => u.id === userId);
        });
      }
      return conversations;
    } catch (error) {
      this.logger.error(error);
      throw new AnErrorOccuredException(error.message);
    }
  }

  async createPrivateConversation(user1: UserEntity, user2: UserEntity): Promise<ConversationEntity> {
    try {
      const members = await this.memberService.createMembers([user1, user2]);

      const conversation = this.conversationRepo.create({
        id: user1.id + '-' + user2.id,
        members,
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
      const members = await this.memberService.createMembers([creator, ...users]);
      const groupName = members.map((m) => m.user.username).join(', ');
      const conversation = this.conversationRepo.create({
        name: groupName,
        id: utils.generateId(11),
        type: ConversationType.GROUP,
        members,
      });

      const converSnapshot = await this.conversationRepo.save(conversation);
      const membersName = members
        .filter((m) => {
          if (m.user.id != creator.id) {
            return true;
          }
          return false;
        })
        .map((m) => m.user.username);
      this.logger.debug(membersName);
      const messages = await this.messageService.generateCreateGroup(creator, membersName, converSnapshot);

      // add last message to conversation
      conversation.last_message = messages[messages.length - 1];
      this.conversationRepo.save(conversation);

      return messages;
    } catch (error) {
      this.logger.error(error);
      throw new AnErrorOccuredException(error.message);
    }
  }

  async leaveGroupConversation(user: UserEntity, conversationId: string): Promise<MessageEntity> {
    try {
      const last_message = `${user.username} đã rời khỏi cuộc trò chuyện`;
      const conversation = await this.conversationRepo
        .createQueryBuilder('conversations')
        .where('conversations.id = :id', { id: conversationId })
        .leftJoinAndSelect('conversations.members', 'members')
        .leftJoinAndSelect('members.user', 'users')
        .getOne();
      if (!conversation) {
        throw new ConversationNotFoundException();
      }

      const members = conversation.members.filter((m) => m.user.id !== user.id);

      if (members.length === 0) {
        await this.conversationRepo.delete({ id: conversationId });
      } else {
        conversation.members = members;
        conversation.name = members.map((m) => m.user.username).join(', ');
      }
      // add last message to conversation
      const message = await this.messageService.create({
        content: last_message,
        type: MessageType.SYSTEM,
        conversation,
      });
      conversation.last_message = message;
      //TODO: MAYBE
      this.conversationRepo.save(conversation);
      return message;
    } catch (error) {
      this.logger.error(error, this.leaveGroupConversation.name);
      throw new AnErrorOccuredException(error.message);
    }
  }

  async updateGroupConversation(
    user: UserEntity,
    conversationId: string,
    fields: IConversationFields,
  ): Promise<MessageEntity> {
    try {
      const conversation = await this.getConversationWithRelationMember(conversationId);
      if (!conversation) {
        throw new ConversationNotFoundException();
      }
      let content = '';

      if (fields.name) {
        content = `${user.username} đã đổi tên cuộc trò chuyện thành ${fields.name}`;
        conversation.name = fields.name;
      } else if (fields.avatar) {
        conversation.avatar = fields.avatar;
        content = `${user.username} đã đổi ảnh đại diện cuộc trò chuyện`;
      } else if (fields.theme) {
        conversation.theme = fields.theme;
        content = `${user.username} đã đổi chủ đề cuộc trò chuyện thành ${fields.theme}`;
      } else if (fields.member) {
        const member = conversation.members.find((m) => m.id === fields.member.id);

        content = `${user.username} đã đặt tên biệt danh của ${member.user.username} thành ${fields.member.nickname}`;
        member.nickname = fields.member.nickname;
        await this.memberService.save(member);
      }
      const message = await this.messageService.create({
        content,
        type: MessageType.SYSTEM,
        conversation,
      });
      return await this.saveLastMessage(message, conversation);
    } catch (error) {
      this.logger.error(error);
      throw new AnErrorOccuredException(error.message);
    }
  }

  async saveLastMessage(message: MessageEntity, conversation: ConversationEntity): Promise<MessageEntity> {
    conversation.last_message = message;
    this.conversationRepo.save(conversation);
    return message;
  }

  async addMembersToGroupConversation(
    user: UserEntity,
    conversationId: string,
    users: UserEntity[],
  ): Promise<MessageEntity[]> {
    const conversation = await this.getConversationWithRelationMember(conversationId);

    if (!conversation) {
      throw new ConversationNotFoundException();
    }

    try {
      const members = await this.memberService.createMembers(users);
      const membersAdded = conversation.members.concat(members);

      conversation.members = membersAdded;
      conversation.name = membersAdded.map((m) => m.user.username).join(', ');
      const membersName = members.map((m) => m.user.username);
      const messages = await this.messageService.generateAddMembers(user, membersName, conversation);

      conversation.last_message = messages[messages.length - 1];
      await this.conversationRepo.save(conversation);
      this.saveLastMessage(messages[messages.length - 1], conversation);
      return messages;
    } catch (error) {
      this.logger.error(error);
      throw new AnErrorOccuredException(error.message);
    }
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

      const message = await this.messageService.create({
        content: `${user.username} đã xóa nhóm`,
        type: MessageType.SYSTEM,
        conversation,
      });
      this.saveLastMessage(message, conversation);
      return message;
    } catch (error) {
      this.logger.error(error);
      throw new AnErrorOccuredException(error.message);
    }
  }

  async removeUserFromGroupConversation(id: string, user: UserEntity, user1: UserEntity) {
    try {
      const conversation = await this.getConversationById(id);
      const content = `${user.username} đã xóa ${user1.username}`;
      if (!conversation) {
        throw new ConversationNotFoundException();
      }

      const isJoined = conversation.members.find((m) => m.user.id === user1.id);
      if (!isJoined) {
        throw new Error('Người dùng chưa tham gia cuộc trò chuyện');
      }

      conversation.members = conversation.members.filter((m) => m.user.id !== user1.id);

      const message = await this.messageService.create({
        content: content,
        type: MessageType.SYSTEM,
        conversation,
      });

      conversation.last_message = message;
      this.conversationRepo.save(conversation);
      return message;
    } catch (error) {
      this.logger.error(error);
      throw new AnErrorOccuredException(error.message);
    }
  }

  async deleteConversation(userId: string, conversationId: string) {
    try {
      const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
      const member = await this.memberService.findMember(userId, conversationId);

      member.deleted_conversation_at = new Date();

      const conversation = await this.getConversationById(conversationId);
      if (!conversation) {
        throw new ConversationNotFoundException();
      }

      conversation.users_deleted = conversation.users_deleted || [];
      conversation.users_deleted.push(user);

      await this.conversationRepo.save(conversation);
      await this.memberService.save(member);
    } catch (error) {
      throw new AnErrorOccuredException(error.message);
    }
  }

  async deleteAllConversations() {
    try {
      await this.conversationRepo.delete({});
    } catch (error) {
      this.logger.error(error, this.deleteAllConversations.name);
      throw new AnErrorOccuredException(error.message);
    }
  }

  async createMessage(
    conversation: ConversationEntity,
    content: string,
    senderId: string,
    type?: MessageType,
    files?: FileDto[],
  ) {
    try {
      const sender = await this.memberService.findMember(senderId, conversation.id);

      conversation.users_deleted = [];
      let fileEntities: FileEntity[] = [];
      if (files) {
        files.forEach((file) => {
          fileEntities.push(this.fileRepo.create(file));
        });
        fileEntities = await this.fileRepo.save(fileEntities);
      }
      const message = await this.messageService.create({
        content,
        sender,
        type,
        conversation,
        files: fileEntities,
      });

      this.saveLastMessage(message, conversation);
      return message;
    } catch (error) {
      this.logger.error(error);
      throw new AnErrorOccuredException(error.message);
    }
  }

  async seen(conversationId: string, messageId: string, user: UserEntity): Promise<any> {
    try {
      const conversation = await this.getConversationById(conversationId);

      let seen = await this.seenRepo
        .createQueryBuilder('seen')
        .leftJoin('seen.user', 'user')
        .leftJoin('seen.conversation', 'conversation')
        .where('user.id = :userId', { userId: user.id })
        .where('conversation.id = :conversationId', { conversationId })
        .getOne();

      if (!seen) {
        seen = this.seenRepo.create({ conversation, messageId, user });

        this.seenRepo.save(seen);
      } else {
        seen.messageId = messageId;
        this.seenRepo.save(seen);
      }
      return {
        message: {
          id: messageId,
        },
        user: {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
        },
        conversation: {
          id: conversation.id,
        },
      };
    } catch (error) {
      this.logger.error(error, error.stack);
      throw new AnErrorOccuredException(error.message);
    }
  }
  // throw new AnErrorOccuredException(error.message);
}
