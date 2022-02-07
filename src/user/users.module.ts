import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostModule } from '../post/post.module';
import { FriendRequestEntity } from './entity/friend-request';
// import { UserFollowerEntity } from 'src/user/user-follow';
import { UserEntity } from './user';
import { UsersController } from './users.controller';
import { UserService } from './users.service';
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, FriendRequestEntity])],
  controllers: [UsersController],
  providers: [UserService],
  exports: [UserService, TypeOrmModule.forFeature([UserEntity])],
})
export class UserModule {}
