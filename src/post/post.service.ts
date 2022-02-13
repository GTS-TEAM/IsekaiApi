import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommentEntity } from 'src/post/entities/comment';
import { FindOneOptions, Repository } from 'typeorm';
import { PhotoRouterType } from '../common/constants/enum';
import { UserEntity } from '../user/user';
import { PostDto } from './dtos/post-request.dto';
import { PostResponseDto } from './dtos/post-response.dto';
import { PostEntity } from './entities/post';
import { LikeService } from './like.service';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
    @InjectRepository(CommentEntity)
    private readonly commentRepo: Repository<CommentEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly likeService: LikeService, // private readonly redisCache: RedisCacheService,
  ) {}
  /**
   * Query builder for get post
   */

  createQueryBuilderGetPosts(offset: number) {
    return this.postRepo
      .createQueryBuilder('posts')
      .orderBy('posts.created_at', 'DESC')
      .skip(7 * (offset - 1))
      .take(7)
      .select([
        'posts.id',
        'posts.image',
        'posts.description',
        'posts.emoji',
        'posts.created_at',
        'posts.updated_at',
        'user.id',
        'user.avatar',
        'user.username',
        'user.background',
        'user.bio',
      ])
      .leftJoin('posts.user', 'user')
      .loadRelationCountAndMap('posts.commentCount', 'posts.comments')
      .loadRelationCountAndMap('posts.likeCount', 'posts.likes')
      .leftJoinAndSelect('posts.likes', 'likes');
  }

  /**
   * POST
   */
  updatePost(post: PostEntity, postDto: PostDto) {
    post.image = postDto.image;
    post.description = postDto.description;
    post.emoji = postDto.emoji;
    return this.postRepo.save(post);
  }

  async createPost(post: PostDto, userId: string): Promise<PostResponseDto> {
    try {
      const postSnapshot = this.postRepo.create(post);
      const user = await this.userRepo.findOne({ where: { id: userId } });
      postSnapshot.user = user;
      const postRes = await this.postRepo.save(postSnapshot);
      return {
        ...postRes,
        likeCount: 0,
        commentCount: 0,
        liked: false,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException('Can not create post, try again later', error.message);
    }
  }

  async deleteAllPost() {
    this.postRepo.delete({});
  }

  async createComment(postId: string, userId: string, comment: string) {
    try {
      const post = await this.postRepo.findOneOrFail(postId, {
        relations: ['comments'],
      });

      const user = await this.userRepo.findOneOrFail(userId);

      const newComment = this.commentRepo.create({
        content: comment,
        user,
        post,
      });
      const commentSnapshot = await this.commentRepo.save(newComment);

      post.comments.push(newComment);
      this.postRepo.save(post);

      delete commentSnapshot.post;

      return commentSnapshot;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Có lỗi xảy ra vui lòng thử lại', error.message);
    }
  }

  // get post comments
  async getPostComments(postId: string, offset: number) {
    try {
      const comments = await this.commentRepo
        .createQueryBuilder('comments')
        .skip(5 * (offset - 1))
        .take(5)
        .where('comments.post = :postId', { postId: postId })
        .leftJoinAndSelect('comments.user', 'user')
        .getMany();
      return comments;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Có lỗi xảy ra vui lòng thử lại', error.message);
    }
  }

  async deletePost(postId: string, userId: string) {
    try {
      const post = await this.checkUserOwnsPost(postId, userId);
      await this.postRepo.remove(post);
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Có lỗi xảy ra vui lòng thử lại', error.message);
    }
  }

  async getUserTimeline(userId: string, page: number) {
    try {
      const postsSnapshot = await this.createQueryBuilderGetPosts(page).getMany();
      const posts = await this.likeService.checkLikedAndReturnPosts(postsSnapshot, userId);
      return posts;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Có lỗi xảy ra vui lòng thử lại', error.message);
    }
  }

  // get user post
  async getUserPosts(userId: string, page: number) {
    try {
      const post = await this.createQueryBuilderGetPosts(page).where('posts.user = :userId', { userId: userId }).getMany();

      return await this.likeService.checkLikedAndReturnPosts(post, userId);
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Có lỗi xảy ra vui lòng thử lại', error.message);
    }
  }

  async getPost(userId: string, id: string) {
    try {
      const postSnapshot = await this.postRepo
        .createQueryBuilder('posts')
        .where('posts.id = :id', { id })
        .select([
          'posts.id',
          'posts.image',
          'posts.description',
          'posts.emoji',
          'posts.created_at',
          'posts.updated_at',
          'user.id',
          'user.avatar',
          'user.username',
          'user.background',
          'user.bio',
        ])
        .leftJoin('posts.user', 'user')
        .loadRelationCountAndMap('posts.commentCount', 'posts.comments')
        .loadRelationCountAndMap('posts.likeCount', 'posts.likes')
        .leftJoinAndSelect('posts.likes', 'likes')
        .getOneOrFail();
      return await this.likeService.checkLikedAndReturnPost(postSnapshot, userId);
    } catch (error) {
      throw new NotFoundException('Có lỗi xảy ra vui lòng thử lại', error.message);
    }
  }

  find(options?: FindOneOptions<PostEntity>) {
    return this.postRepo.find(options);
  }

  async checkPostExists(postId: string) {
    try {
      return await this.postRepo.findOneOrFail(postId);
    } catch (error) {
      this.logger.error(error);

      throw new NotFoundException('Có lỗi xảy ra vui lòng thử lại', error.message);
    }
  }

  async checkUserOwnsPost(postId: string, userId: string) {
    const post = await this.postRepo.findOne({
      where: {
        id: postId,
        user: userId,
      },
    });
    if (!post) {
      throw new BadRequestException("You don't own this post");
    }
    return post;
  }

  /**
   * COMMENT
   */

  // delete a comment
  async deleteComment(commentId: string, userId: string) {
    const comment = await this.checkUserOwnsComment(commentId, userId);
    await this.commentRepo.remove(comment);
  }

  // check user owns comment
  async checkUserOwnsComment(commentId: string, userId: string) {
    const comment = await this.commentRepo.findOneOrFail({ where: { id: commentId }, relations: ['user'] });

    if (comment.user.id !== userId) {
      throw new BadRequestException("You can't delete this comment");
    }
    return comment;
  }

  // update a comment
  async updateComment(commentId: string, comment: string, userId: string) {
    try {
      const commentToUpdate = await this.checkUserOwnsComment(commentId, userId);
      commentToUpdate.content = comment;
      await this.commentRepo.save(commentToUpdate);
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Can not update comment', error.message);
    }
  }

  /**
   * Profile
   */

  // Get user photos profile
  async getUserPhotosProfile(userId: string, type: PhotoRouterType) {
    const query = this.postRepo
      .createQueryBuilder('posts')
      .select(['posts.id', 'posts.image'])
      .where('posts.user = :userId', { userId });
    if (type === PhotoRouterType.PROFILE) {
      query.limit(9);
    }
    const photos = await query.getMany();
    return photos;
  }
}
