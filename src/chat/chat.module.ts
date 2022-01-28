import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { ConversationModule } from '../conversation/conversation.module';
import { UsersModule } from '../user/users.module';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [AuthModule, UsersModule, ConversationModule],
  providers: [ChatGateway],
})
export class ChatModule {}
