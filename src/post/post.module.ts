import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentEntity } from 'src/post/entity/comment';
import { UserModule } from '../user/users.module';
import { PostEntity } from './entity/post';
import { LikeService } from './like.service';
import { PostController } from './post.controller';
import { PostService } from './post.service';

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity, CommentEntity]), UserModule],
  controllers: [PostController],
  providers: [PostService, LikeService],
  exports: [PostService, TypeOrmModule.forFeature([PostEntity, CommentEntity])],
})
export class PostModule {}
