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
import { TokenType } from '../common/constants/enum';
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
  async onMessage(client, data: { message: string; receiverId?: string; conversationId?: string }) {
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
          conversation = await this.conversationService.createConversation([user, target]);

          const receiverClient = this.connectedUsers.find((s) => s.userId === data.receiverId);

          client.join(conversation.id);
          receiverClient.client.join(conversation.id);
        }
      } else {
        // group
        conversation = await this.conversationService.getGroupConversation(convId);
      }
      convId = conversation.id;

      const message = await this.conversationService.createMessage(convId, data.message, user.id);

      delete message.sender.email;
      // delete message.sender.emailVerified;
      delete message.sender.created_at;
      this.server.to(convId).emit('message', message);
    } catch (error) {
      this.logger.error(error, error);
      this.server.to(client.id).emit('message', { message: error.message });
    }
  }

  @SubscribeMessage('create-group')
  async onCreateGroup(client: Socket | any, data: { user1_id: string; user2_id: string }) {
    try {
      const user = await this.tokenSerivce.verifyToken(client.handshake.query.token, TokenType.AccessToken);
      const user1 = await this.userService.getUserById(data.user1_id);
      const user2 = await this.userService.getUserById(data.user2_id);

      const message = await this.conversationService.createGroupConversation(user, [user1, user2]);
      const client1 = this.connectedUsers.find((s) => s.userId === data.user1_id);
      const client2 = this.connectedUsers.find((s) => s.userId === data.user2_id);

      client.join(message.conversation.id);
      for (const cl of [client1, client2]) {
        cl.client.join(message.conversation.id);
      }
      this.server.to(message.conversation.id).emit('message', message);
    } catch (error) {
      this.logger.error(error);
      this.server.to(client.id).emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('add-user-to-group')
  async onJoinGroup(client, data: { user_id: string; conversationId: string }) {
    try {
      const user = await this.tokenSerivce.verifyToken(client.handshake.query.token, TokenType.AccessToken);
      const user1 = await this.userService.getUserById(data.user_id);

      const message = await this.conversationService.addUserToGroupConversation(data.conversationId, user, user1);
      const client1 = this.connectedUsers.find((s) => s.userId === data.user_id);

      if (client1) {
        client1.client.join(message.conversation.id);
      }

      this.server.to(data.conversationId).emit('message', message);
    } catch (error) {
      this.logger.error(error);
      this.server.to(client.id).emit('error', { message: error.message });
    }
  }
}
