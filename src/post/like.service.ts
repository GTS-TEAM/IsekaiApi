import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/user';
import { PostEntity } from './entity/post';

@Injectable()
export class LikeService {
  private readonly logger = new Logger(LikeService.name);
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  // get post likes
  async getPostLikes(postId: string) {
    try {
      const likes = await this.postRepo
        .createQueryBuilder('posts')
        .where('posts.id = :postId', { postId: postId })
        .select(['posts.id', 'likes.id', 'likes.username', 'likes.avatar', 'likes.background'])
        .leftJoin('posts.likes', 'likes')
        .getMany();
      return likes;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Có lỗi xảy ra vui lòng thử lại', error.message);
    }
  }

  async likePost(postId: string, userId: string) {
    const post = await this.postRepo.findOne({
      where: { id: postId },
      relations: ['likes', 'comments', 'user'],
    });

    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      let like = post.likes.find((user) => user.id === userId);
      if (like) {
        const index = post.likes.indexOf(like);
        post.likes.splice(index, 1);
        await this.postRepo.save(post);
      } else {
        post.likes.push(user);
        await this.postRepo.save(post);
      }
    } catch (error) {
      this.logger.error(error);
    }

    return this.postRepo.save(post);
  }

  async checkLikedAndReturnPost(post: PostEntity, userId: string) {
    try {
      const check = await this.checkUserLikedPost(post.id, userId);
      let liked = false;
      if (check) {
        liked = true;
      }
      return { ...post, liked };
    } catch (error) {
      this.logger.error('Check', error.message);
      throw new BadRequestException('Can not check user liked post');
    }
  }

  async checkLikedAndReturnPosts(posts: PostEntity[], userId: string) {
    try {
      return await Promise.all(posts.map(async (post) => await this.checkLikedAndReturnPost(post, userId)));
    } catch (error) {
      this.logger.error('Check', error.message);
      throw new BadRequestException('Can not check user liked post');
    }
  }
  //check if user liked post
  async checkUserLikedPost(postId: string, userId: string) {
    try {
      // const like = await this.postRepo.findOne({
      //   where: { id: postId, likes: { id: userId } },
      //   relations: ['likes'],
      // });

      const like = await this.postRepo
        .createQueryBuilder('posts')
        .where('posts.id = :postId', { postId: postId })
        .andWhere('likes.id = :userId', { userId: userId })
        .leftJoin('posts.likes', 'likes')
        // .select(['posts.id', 'likes.id', 'likes.username', 'likes.avatar', 'likes.background'])
        .getOne();
      return like ? true : false;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Can not check user liked post');
    }
  }
}
