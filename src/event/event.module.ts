import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { ConversationModule } from '../conversation/conversation.module';
import { UserModule } from '../user/users.module';
import { EventGateway } from './event.gateway';

@Module({
  imports: [AuthModule, UserModule, ConversationModule],
  providers: [EventGateway],
})
export class EventModule {}
