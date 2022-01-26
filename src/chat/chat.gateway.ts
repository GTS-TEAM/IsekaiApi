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
import { ConversationService } from 'src/conversation/conversation.service';
import { TokenType } from '../shared/constants/enum';
import { TokenService } from '../token/token.service';

@WebSocketGateway({ path: '/api/chat/socket.io' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private logger = new Logger(ChatGateway.name);
  constructor(private tokenSerivce: TokenService, private readonly conversationService: ConversationService) {}
  @WebSocketServer()
  server;
  connectedUsers: string[] = [];
  async handleDisconnect(client) {
    try {
      const user = await this.tokenSerivce.verifyToken(client.handshake.query.token, TokenType.AccessToken);
      this.logger.debug(user.email + ' disconnected');
      const userPos = this.connectedUsers.indexOf(user.id);
      if (userPos > -1) {
        this.connectedUsers = [...this.connectedUsers.slice(0, userPos), ...this.connectedUsers.slice(userPos + 1)];
      }
      this.server.emit('users', this.connectedUsers);
    } catch (error) {}
  }

  async handleConnection(client) {
    try {
      const user = await this.tokenSerivce.verifyToken(client.handshake.query.token, TokenType.AccessToken);

      this.logger.debug(user.email + ' connected');

      this.connectedUsers = [...this.connectedUsers, user.id];
      this.logger.debug(this.connectedUsers);
      this.server.emit('users', this.connectedUsers);
    } catch (error) {
      this.logger.error(error);
      this.server.emit('users', { error: error.response, message: error.message });
    }
  }

  @UseFilters(new BaseWsExceptionFilter())
  @SubscribeMessage('message')
  async onMessage(client, data: any) {
    const event: string = 'message';
    const message = await this.conversationService.createMessage(data.conversationId, data.content, data.senderId);
    client.broadcast.to(data.conversationId).emit(event, message);
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
