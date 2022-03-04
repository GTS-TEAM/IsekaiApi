import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/users.module';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './services/conversation.service';
import { ConversationEntity } from './entities/conversation';
import { MemberEntity } from './entities/member';
import { MessageEntity } from './entities/message';
import { MemberService } from './services/member.service';
import { MessageService } from './services/message.service';
import { FileEntity } from './entities/file';

@Module({
  imports: [UserModule, TypeOrmModule.forFeature([ConversationEntity, MessageEntity, MemberEntity, FileEntity])],
  providers: [ConversationService, MemberService, MessageService],
  controllers: [ConversationController],
  exports: [ConversationService],
})
export class ConversationModule {}
