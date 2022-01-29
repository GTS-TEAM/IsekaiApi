import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentEntity } from 'src/post/entity/comment';
import { UserModule } from '../user/users.module';
import { LikeEntity } from './entity/like';
import { PostEntity } from './entity/post';
import { PostController } from './post.controller';
import { PostService } from './post.service';

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity, LikeEntity, CommentEntity]), UserModule],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
