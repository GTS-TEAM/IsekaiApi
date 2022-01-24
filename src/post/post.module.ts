import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { CommentEntity } from 'src/post/entity/comment';
import { LikeEntity } from './entity/like';
import { PostEntity } from './entity/post';
import { PostController } from './post.controller';
import { PostService } from './post.service';

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity, LikeEntity, CommentEntity])],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
