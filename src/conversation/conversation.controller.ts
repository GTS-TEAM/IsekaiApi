import { Controller, Delete, Get, Logger, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FileType, MessageType } from 'src/common/constants/enum';
import { ConversationService } from './services/conversation.service';
import { ConversationEntity } from './entities/conversation';
import { MessageEntity } from './entities/message';
import { MessageService } from './services/message.service';

@ApiTags('Conversation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('conversations')
export class ConversationController {
  logger = new Logger(ConversationController.name);
  constructor(private readonly conversationService: ConversationService, private readonly messageService: MessageService) {}

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
    return await this.messageService.getMessages(req.user, conversation_id, { limit, offset });
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
    return await this.messageService.getMessagesByCombineId(req.user, receiver_id, { limit, offset });
  }

  @ApiQuery({ name: 'type', enum: FileType })
  @Get('/:conversation_id/files')
  async getFiles(
    @Param('conversation_id') conversation_id: string,
    @Query('limit') limit: number,
    @Query('offset') offset: number,
    @Query('type') type: FileType,
  ) {
    return await this.messageService.getFilesInMessage(conversation_id, { limit, offset }, type);
  }
  @Delete('/all-conversation-dev')
  async deleteAllConversations() {
    return await this.conversationService.deleteAllConversations();
  }

  @Delete('/:conversation_id')
  async deleteConversation(@Request() req, @Param('conversation_id') conversation_id: string) {
    return await this.conversationService.deleteConversation(req.user, conversation_id);
  }
}
