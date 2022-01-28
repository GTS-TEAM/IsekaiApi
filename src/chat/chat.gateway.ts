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
import { TokenType } from '../shared/constants/enum';
import { TokenService } from '../token/token.service';

@WebSocketGateway({ path: '/api/socket.io' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private logger = new Logger(ChatGateway.name);
  constructor(private tokenSerivce: TokenService, private readonly conversationService: ConversationService) {}
  @WebSocketServer()
  server: Server;
  // connectedUsers: string[] = [];
  async handleDisconnect(client: Socket) {
    try {
      client.handshake.query.token;
      const user = await this.tokenSerivce.verifyToken(client.handshake.query.token as string, TokenType.AccessToken);
      this.logger.debug(user.username + ' disconnected');
    } catch (error) {}
  }

  async handleConnection(client) {
    try {
      const user = await this.tokenSerivce.verifyToken(client.handshake.query.token, TokenType.AccessToken);

      //TODO: Set user is online

      this.logger.debug(user.username + ' connected');

      // this.connectedUsers = [...this.connectedUsers, user.id];
      // this.logger.debug(this.connectedUsers);
      // this.server.emit('online', this.connectedUsers);
    } catch (error) {
      this.logger.error(error);
      this.server.emit('online', { error: error.response, message: error.message });
    }
  }

  @UseFilters(new BaseWsExceptionFilter())
  @SubscribeMessage('message')
  async onMessage(client: Socket, data: any) {
    const event: string = 'message';
    try {
      const message = await this.conversationService.createMessage(data.conversationId, data.content, data.senderId);

      delete message.sender.email;
      delete message.sender.roles;
      // delete message.sender.emailVerified;
      delete message.sender.created_at;
      delete message.sender.updated_at;

      delete message.conversation.created_at;
      delete message.conversation.updated_at;
      this.logger.debug(message.content);
      client.broadcast.to(data.conversationId).emit(event, message);
    } catch (error) {
      this.logger.error(error);
      client.broadcast.to(client.id).emit(event, { error: error.response, message: error.message });
    }
  }

  @SubscribeMessage('join')
  async onRoomJoin(client, data: any): Promise<any> {
    if (data.conversationId === undefined) {
      return;
    }
    client.join(data?.conversationId);
  }

  @SubscribeMessage('leave')
  onRoomLeave(client, data: any): void {
    client.leave(data?.conversationId);
  }
}
