import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/users.module';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { ConversationEntity } from './entities/conversation';
import { MessageEntity } from './entities/message';

@Module({
  imports: [UserModule, TypeOrmModule.forFeature([ConversationEntity, MessageEntity])],
  providers: [ConversationService],
  controllers: [ConversationController],
  exports: [ConversationService],
})
export class ConversationModule {}
