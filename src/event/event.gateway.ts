import { Logger, UseFilters } from '@nestjs/common';
import {
  BaseWsExceptionFilter,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

import { ConversationService } from 'src/conversation/conversation.service';
import { In } from 'typeorm';
import { ConversationType, MessageType, TokenType } from '../common/constants/enum';
import { ConversationEntity } from '../conversation/entities/conversation';
import { TokenService } from '../token/token.service';
import { UserService } from '../user/users.service';

@WebSocketGateway({ path: '/api/socket.io' })
export class EventGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private logger = new Logger(EventGateway.name);

  constructor(
    private tokenSerivce: TokenService,
    private readonly conversationService: ConversationService,
    private readonly userService: UserService,
  ) {}

  @WebSocketServer()
  server: Server;

  connectedUsers: { userId: string; client: Socket }[] = [];

  async handleDisconnect(client: Socket) {
    try {
      const user = await this.tokenSerivce.verifyToken(client.handshake.query.token as string, TokenType.AccessToken);
      this.connectedUsers.splice(
        this.connectedUsers.findIndex((c) => c.client === client),
        1,
      );

      this.logger.debug(user.username + ' disconnected');
    } catch (error) {
      this.logger.error(error);
      this.server.emit('error', error.message);
    }
  }

  async handleConnection(client) {
    try {
      const user = await this.tokenSerivce.verifyToken(client.handshake.query.token, TokenType.AccessToken);
      const conversations = await this.conversationService.getUserConversations(user.id);

      const conId = conversations.map((c) => c.id);

      client.join(conId);

      this.connectedUsers.push({ userId: user.id, client });

      this.logger.debug(user.email + ' connected');
      this.server.to(client.id).emit('connect-response', user.username);
    } catch (error) {
      this.server.to(client.id).emit('error', error.message);
      this.logger.error(error);
    }
  }

  @UseFilters(new BaseWsExceptionFilter())
  @SubscribeMessage('message')
  async onMessage(client, data: { message: string; receiverId?: string; conversationId?: string; type?: MessageType }) {
    try {
      const user = await this.tokenSerivce.verifyToken(client.handshake.query.token, TokenType.AccessToken);
      const target = await this.userService.findOne({
        where: { id: data.receiverId },
      });

      let convId = data.conversationId;

      let conversation: ConversationEntity;
      if (!data.conversationId) {
        // private
        conversation = await this.conversationService.getPrivateConversation(user.id, data.receiverId);
        // create new conversation
        if (!conversation) {
          conversation = await this.conversationService.createPrivateConversation(user, target);

          const receiverClient = this.connectedUsers.find((s) => s.userId === data.receiverId);

          client.join(conversation.id);
          if (receiverClient) {
            receiverClient.client.join(conversation.id);
          }
        }
      } else {
        // group
        conversation = await this.conversationService.getConversationById(convId);
      }
      if (conversation.type === ConversationType.DELETED) {
        throw new Error('Nhóm này đã bị xóa');
      }
      convId = conversation.id;

      const message = await this.conversationService.createMessage(convId, data.message, user.id, data.type);

      delete message.sender.email;
      // delete message.sender.emailVerified;
      delete message.sender.created_at;
      this.server.to(convId).emit('message', message);
    } catch (error) {
      this.server.to(client.id).emit('message', { message: error.message });
    }
  }

  @SubscribeMessage('create-group')
  async onCreateGroup(client: Socket | any, data: [string]) {
    try {
      const user = await this.tokenSerivce.verifyToken(client.handshake.query.token, TokenType.AccessToken);
      const members = await this.userService.find({
        where: { id: In(data) },
      });
      const messages = await this.conversationService.createGroupConversation(user, members);
      const membersClient = this.connectedUsers.filter((s) => data.includes(s.userId));

      client.join(messages[0].conversation.id);
      for (let i = 0; i < membersClient.length; i++) {
        membersClient[i].client.join(messages[0].conversation.id);
      }

      for (let i = 0; i < messages.length; i++) {
        this.server.to(messages[0].conversation.id).emit('message', messages[i]);
      }
    } catch (error) {
      this.server.to(client.id).emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('add-members-to-group')
  async onJoinGroup(client, data: { membersId: string[]; conversationId: string }) {
    try {
      const user = await this.tokenSerivce.verifyToken(client.handshake.query.token, TokenType.AccessToken);
      const members = await this.userService.find({
        where: { id: In(data.membersId) },
      });

      const messages = await this.conversationService.addMembersToGroupConversation(user, data.conversationId, members);
      const membersClient = this.connectedUsers.filter((s) => data.membersId.includes(s.userId));

      for (let i = 0; i < membersClient.length; i++) {
        membersClient[i].client.join(messages[0].conversation.id);
      }

      for (let i = 0; i < messages.length; i++) {
        this.server.to(messages[0].conversation.id).emit('message', messages[i]);
      }
    } catch (error) {
      this.server.to(client.id).emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('leave-group')
  async onLeaveGroup(client, data: { conversationId: string }) {
    try {
      const user = await this.tokenSerivce.verifyToken(client.handshake.query.token, TokenType.AccessToken);

      const message = await this.conversationService.leaveGroupConversation(user, data.conversationId);

      this.server.to(data.conversationId).emit('message', message);
      client.leave(data.conversationId);
    } catch (error) {
      this.logger.error(error);
      this.server.to(client.id).emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('delete-group')
  async onDeleteGroup(client, data: { conversationId: string }) {
    try {
      const user = await this.tokenSerivce.verifyToken(client.handshake.query.token, TokenType.AccessToken);

      const message = await this.conversationService.deleteGroupConversation(user, data.conversationId);

      this.server.to(data.conversationId).emit('message', message);
      client.leave(data.conversationId);
    } catch (error) {
      this.logger.error(error);
      this.server.to(client.id).emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('update-conversation')
  async onUpdateConversation(
    client,
    data: { conversationId: string; fields: { name?: string; avatar?: string; theme?: string } },
  ) {
    try {
      const user = await this.tokenSerivce.verifyToken(client.handshake.query.token, TokenType.AccessToken);

      const message = await this.conversationService.updateGroupConversation(user, data.conversationId, data.fields);

      this.server.to(data.conversationId).emit('message', message);
    } catch (error) {
      this.logger.error(error);
      this.server.to(client.id).emit('error', { message: error.message });
    }
  }
}
