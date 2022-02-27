import { Controller, Delete, Get, Logger, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ConversationService } from './conversation.service';
import { ConversationEntity } from './entities/conversation';
import { MessageEntity } from './entities/message';

@ApiTags('Conversation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('conversations')
export class ConversationController {
  logger = new Logger(ConversationController.name);
  constructor(private readonly conversationService: ConversationService) {}

  @ApiResponse({ status: 200, description: "Return user's conversations", type: ConversationEntity, isArray: true })
  @Get('/')
  async getUserConversations(@Request() req, @Query('limit') limit: number, @Query('offset') offset: number) {
    return await this.conversationService.getUserConversations(req.user, { limit, offset });
  }

  @ApiOkResponse({ status: 200, description: 'Return message in conversation', type: MessageEntity })
  @Get('/message/:conversation_id')
  async getMessages(
    @Request() req,
    @Param('conversation_id') conversation_id: string,
    @Query('limit') limit: number,
    @Query('offset') offset: number,
  ) {
    return await this.conversationService.getMessages(req.user, conversation_id, { limit, offset });
  }

  @ApiOkResponse({ status: 200, description: 'Return conversation', type: ConversationEntity })
  @Get('/r/:receiver_id')
  async getPrivateConversation(@Request() req, @Param('receiver_id') conversation_id: string): Promise<ConversationEntity> {
    return await this.conversationService.getPrivateConversation(req.user, conversation_id);
  }

  @ApiOkResponse({ status: 200, description: 'Return conversation', type: ConversationEntity })
  @Get('/:conversation_id')
  async getConversationById(@Param('conversation_id') conversation_id: string): Promise<ConversationEntity> {
    return await this.conversationService.getConversationById(conversation_id);
  }

  @Get('/:receiver_id/messages')
  async getMessagesByCombineId(
    @Request() req,
    @Param('receiver_id') receiver_id: string,
    @Query('limit') limit: number,
    @Query('offset') offset: number,
  ) {
    return await this.conversationService.getMessagesByCombineId(req.user, receiver_id, { limit, offset });
  }

  @Delete('/:conversation_id')
  async deleteConversation(@Request() req, @Param('conversation_id') conversation_id: string) {
    return await this.conversationService.deleteConversation(req.user, conversation_id);
  }

  @Delete('/all-message-dev')
  async deleteAllMessages() {
    return await this.conversationService.deleteAllMessages();
  }

  @Delete('/all-conversation-dev')
  async deleteAllConversations() {
    return await this.conversationService.deleteAllConversations();
  }
}
