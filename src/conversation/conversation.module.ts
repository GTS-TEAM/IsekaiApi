// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { RedisCacheModule } from 'src/shared/redis-cache/redis-cache.module';
// import { UsersModule } from 'src/user/users.module';
// import { ConversationController } from './conversation.controller';
// import { ConversationService } from './conversation.service';
// import { ConversationEntity } from './entity/conversation';
// import { MessageEntity } from './entity/message';

// @Module({
//   imports: [
//     TypeOrmModule.forFeature([ConversationEntity, MessageEntity]),
//     UsersModule,
//     RedisCacheModule,
//   ],
//   providers: [ConversationService],
//   controllers: [ConversationController],
//   exports: [
//     ConversationService,
//     TypeOrmModule.forFeature([ConversationEntity]),
//   ],
// })
// export class ConversationModule {}
