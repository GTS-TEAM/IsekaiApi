import { BadGatewayException, Logger, UseFilters } from '@nestjs/common';
import {
  BaseWsExceptionFilter,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

import { ConversationService } from 'src/conversation/conversation.service';
import { In } from 'typeorm';
import { TokenType } from '../common/constants/enum';
import { TokenService } from '../token/token.service';

@WebSocketGateway({ path: '/api/socket.io' })
export class EventGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private logger = new Logger(EventGateway.name);
  constructor(private tokenSerivce: TokenService, private readonly conversationService: ConversationService) {}
  @WebSocketServer()
  server: Server;
  connectedUsers: { userId: string; clientId: string }[] = [];
  async handleDisconnect(client: Socket) {
    try {
      const user = await this.tokenSerivce.verifyToken(client.handshake.query.token as string, TokenType.AccessToken);
      this.logger.debug(user.username + ' disconnected');
    } catch (error) {}
  }

  async handleConnection(client) {
    try {
      const user = await this.tokenSerivce.verifyToken(client.handshake.query.token, TokenType.AccessToken);
      this.connectedUsers.push({ userId: user.id, clientId: client.id });
      this.server.to(client.id).emit('connect-response', user.username);
    } catch (error) {
      this.server.emit('connect-response', error.message);
      this.logger.error(error);
    }
  }

  @UseFilters(new BaseWsExceptionFilter())
  @SubscribeMessage('message')
  async onMessage(client, data: { receiverId: string; message: string }) {
    try {
      const user = await this.tokenSerivce.verifyToken(client.handshake.query.token, TokenType.AccessToken);
      const conversation = await this.conversationService.getConversation(user.id, data.receiverId);

      const message = await this.conversationService.createMessage(conversation.id, data.message, user.id);

      delete message.sender.email;
      // delete message.sender.emailVerified;
      delete message.sender.created_at;
      const receiverClientId = this.connectedUsers.find((u) => u.userId === data.receiverId)?.clientId;
      client.to(receiverClientId).emit('message', message);
    } catch (error) {
      this.logger.error(error);
      client.to(client.id).emit('message', { error: error.response, message: error.message });
    }
  }
}
