import { BadRequestException, Body, Controller, Get, Logger, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  constructor(private readonly conversationService: ConversationService, private readonly userService: UserService) {}

  @Get('/')
  async getConversations(@Request() req) {
    const conversations = await this.conversationService.getConversations(req.user);
    return conversations;
  }

  @Post('/create')
  async createConversation(@Body() createConversationDto: CreateConversationDto, @Request() req) {
    const friend = await this.userService.checkIfUserHasConversation(req.user, createConversationDto.userId);
    if (!friend) {
      throw new BadRequestException('Conversation already exist');
    }
    return this.conversationService.createConversation([friend, req.user]);
  }

  @Get('/:conversationId')
  async getMessages(@Param('conversationId') conversationId: string) {
    const messages = await this.conversationService.getMessages(conversationId);
    return messages;
  }
}
