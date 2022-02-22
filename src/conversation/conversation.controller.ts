import { BadRequestException, Body, Controller, Get, Logger, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserService } from 'src/user/users.service';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dtos/create-conversation.dto';

@ApiTags('Conversation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('conversations')
export class ConversationController {
  logger = new Logger(ConversationController.name);
  constructor(private readonly conversationService: ConversationService) {}

  @Get('/message/:conversation_id')
  async getMessages(
    @Request() req,
    @Param('conversation_id') conversation_id: string,
    @Query('limit') limit: number,
    @Query('offset') offset: number,
  ) {
    return await this.conversationService.getMessages(conversation_id, limit, offset);
  }

  @ApiResponse({ status: 200, description: "Return user's conversations" })
  @Get('/')
  async getUserConversations(@Request() req, @Query('limit') limit: number, @Query('offset') offset: number) {
    return await this.conversationService.getUserConversations(req.user, limit, offset);
  }
}
