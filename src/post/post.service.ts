import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { UserEntity } from '../user/user';
import { PostDto } from './dto/post-request.dto';
import { PostEntity } from './entity/post';
import { CommentEntity } from 'src/post/entity/comment';
import { PostResponseDto } from './dto/post-response.dto';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
    @InjectRepository(CommentEntity)
    private readonly commentRepo: Repository<CommentEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>, // private readonly redisCache: RedisCacheService,
  ) {}

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
        likes: 0,
        comments: 0,
        liked: false,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException('Can not create post, try again later');
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
      throw new BadRequestException('Có lỗi xảy ra vui lòng thử lại', error);
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
      throw new BadRequestException('Có lỗi xảy ra vui lòng thử lại', error);
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

  // get post likes
  async getPostLikes(postId: string) {
    try {
      const likes = await this.postRepo
        .createQueryBuilder('posts')
        .where('posts.id = :postId', { postId: postId })
        .select(['posts.id', 'likes.id', 'likes.username', 'likes.profilePicture', 'likes.background'])
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
      this.logger.debug(JSON.stringify(user));
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

  async getUserTimeline(userId: string, page: number) {
    try {
      const postsSnapshot = await this.postRepo
        .createQueryBuilder('posts')
        .orderBy('posts.created_at', 'DESC')
        .skip(7 * (page - 1))
        .take(7)
        .leftJoinAndSelect('posts.user', 'user')
        .loadRelationCountAndMap('posts.comments', 'posts.comments')
        .loadRelationCountAndMap('posts.likes', 'posts.likes')
        .getMany();
      // check if user already liked post
      const post = await this.checkLikedAndReturnPosts(postsSnapshot, userId);
      return post;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Có lỗi xảy ra vui lòng thử lại', error.message);
    }
  }

  async checkLikedAndReturnPosts(posts: PostEntity[], userId: string) {
    try {
      return await Promise.all(
        posts.map(async (post) => {
          const check = await this.checkUserLikedPost(post.id, userId);
          let liked = false;
          if (check) {
            liked = true;
          }
          return { ...post, liked };
        }),
      );
    } catch (error) {
      this.logger.error('Check', error.message);
    }
  }
  //check if user liked post
  async checkUserLikedPost(postId: string, userId: string) {
    try {
      const like = await this.postRepo.findOne({
        where: { post: { id: postId }, likes: { id: userId } },
        relations: ['post', 'user'],
      });
      return like ? true : false;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Can not check user liked post');
    }
  }
  // get user post
  async getUserPosts(userId: string, page: number) {
    try {
      const post = await this.postRepo
        .createQueryBuilder('posts')
        .select(['posts', 'user.id'])
        .orderBy('posts.created_at', 'DESC')
        .skip(5 * (page - 1))
        .take(5)
        .leftJoinAndSelect('posts.user', 'user')
        .loadRelationCountAndMap('posts.comments', 'posts.comments')
        .loadRelationCountAndMap('posts.likes', 'posts.likes')
        .where('posts.user = :userId', { userId: userId })
        .getMany();

      return await this.checkLikedAndReturnPosts(post, userId);
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Có lỗi xảy ra vui lòng thử lại', error.message);
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
}
