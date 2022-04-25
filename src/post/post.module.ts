import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentEntity } from 'src/post/entities/comment';
import { EventModule } from '../event/event.module';
import { NotificationModule } from '../notification/notification.module';
import { UserModule } from '../user/users.module';
import { PostEntity } from './entities/post';
import { LikeService } from './like.service';
import { PostController } from './post.controller';
import { PostService } from './post.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostEntity, CommentEntity]),
    UserModule,
    EventModule,
    forwardRef(() => NotificationModule),
  ],
  controllers: [PostController],
  providers: [PostService, LikeService],
  exports: [PostService, TypeOrmModule.forFeature([PostEntity, CommentEntity])],
})
export class PostModule {}
