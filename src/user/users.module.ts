import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationEntity } from '../conversation/entity/conversation';
import { MessageEntity } from '../conversation/entity/message';
import { NotificationEntity } from '../notification/notification';
// import { UserFollowerEntity } from 'src/user/user-follow';
import { UserEntity } from './user';
import { UsersController } from './users.controller';
import { UserService } from './users.service';
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ConversationEntity, MessageEntity])],
  controllers: [UsersController],
  providers: [UserService],
  exports: [UserService, TypeOrmModule.forFeature([UserEntity])],
})
export class UsersModule {}
