import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { UserEntity } from '../user/user';
import { PostDto } from './dto/post-request.dto';
import { PostEntity } from './entity/post';
import { LikeEntity } from 'src/post/entity/like';
import { CommentEntity } from 'src/post/entity/comment';
import { PostResponseDto } from './dto/post-response.dto';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    @InjectRepository(PostEntity)
    private readonly postEntity: Repository<PostEntity>,
    @InjectRepository(LikeEntity)
    private readonly likeEntity: Repository<LikeEntity>,
    @InjectRepository(CommentEntity)
    private readonly commentEntity: Repository<CommentEntity>, // private readonly redisCache: RedisCacheService,
  ) {}

  updatePost(post: PostEntity, postDto: PostDto) {
    post.image = postDto.image;
    post.description = postDto.description;
    return this.postEntity.save(post);
  }

  async createPost(post: PostDto, user: UserEntity): Promise<PostResponseDto> {
    try {
      const postSnapshot = this.postEntity.create(post);
      postSnapshot.user = user;
      const postRes = await this.postEntity.save(postSnapshot);
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
    this.postEntity.delete({});
  }

  async createComment(postId: string, user: UserEntity, comment: string) {
    try {
      const post = await this.postEntity.findOneOrFail(postId, {
        relations: ['comments'],
      });
      const newComment = this.commentEntity.create({
        content: comment,
        user,
        post,
      });
      const commentSnapshot = await this.commentEntity.save(newComment);

      post.comments.push(newComment);
      this.postEntity.save(post);
      delete commentSnapshot.post;
      return commentSnapshot;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Can not create comment');
    }
  }

  // get post comments
  async getPostComments(postId: string, offset: number) {
    try {
      const comments = await this.commentEntity
        .createQueryBuilder('comments')
        .skip(5 * (offset - 1))
        .take(5)
        .where('comments.post = :postId', { postId: postId })
        .leftJoinAndSelect('comments.user', 'user')
        .getMany();
      return comments;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Can not get post comments');
    }
  }

  async deletePost(postId: string, user: UserEntity) {
    try {
      const post = await this.checkUserOwnsPost(postId, user.id);
      await this.postEntity.remove(post);
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException(error.message);
    }
  }

  async likePost(postId: string, user: UserEntity) {
    const post = await this.postEntity.findOne({
      where: { id: postId },
      relations: ['likes', 'comments', 'user'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    let like = await this.likeEntity.findOne({ where: { post, user } });
    if (like) {
      const index = post.likes.indexOf(like);
      post.likes.splice(index, 1);
      await this.likeEntity.remove(like);
    } else {
      const like = this.likeEntity.create({ post, user });

      await this.likeEntity.save(like);
      post.likes.push(like);
    }

    return this.postEntity.save(post);
  }

  async getUserTimeline(user: UserEntity, page: number) {
    try {
      const postsSnapshot = await this.postEntity
        .createQueryBuilder('posts')
        .orderBy('posts.created_at', 'DESC')
        .skip(7 * (page - 1))
        .take(7)
        .leftJoinAndSelect('posts.user', 'user')
        .loadRelationCountAndMap('posts.comments', 'posts.comments')
        .loadRelationCountAndMap('posts.likes', 'posts.likes')
        .getMany();
      // check if user already liked post
      const post = await this.checkLikedAndReturnPosts(postsSnapshot, user.id);
      return post;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Can not get post', error.message);
    }
  }

  async checkLikedAndReturnPosts(posts: PostEntity[], userId: string) {
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
  }
  //check if user liked post
  async checkUserLikedPost(postId: string, userId: string) {
    try {
      const like = await this.likeEntity.findOne({
        where: { post: { id: postId }, user: { id: userId } },
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
      const post = await this.postEntity
        .createQueryBuilder('posts')
        .select(['posts', 'user.id'])
        .orderBy('posts.created_at', 'DESC')
        .skip(5 * page)
        .take(5)
        .leftJoinAndSelect('posts.user', 'user')
        .loadRelationCountAndMap('posts.comments', 'posts.comments')
        .loadRelationCountAndMap('posts.likes', 'posts.likes')
        .where('posts.user = :userId', { userId: userId })
        .getMany();

      return await this.checkLikedAndReturnPosts(post, userId);
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Can not get post');
    }
  }

  find(options?: FindOneOptions<PostEntity>) {
    return this.postEntity.find(options);
  }

  async checkPostExists(postId: string) {
    try {
      return await this.postEntity.findOneOrFail(postId);
    } catch (error) {
      this.logger.error(error);

      throw new NotFoundException('Post not found');
    }
  }

  async checkUserOwnsPost(postId: string, userId: string) {
    const post = await this.postEntity.findOne({
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
  async deleteComment(commentId: string, user: UserEntity) {
    const comment = await this.checkUserOwnsComment(commentId, user);
    await this.commentEntity.remove(comment);
  }
  // check user owns comment
  async checkUserOwnsComment(commentId: string, user: UserEntity) {
    const comment = await this.commentEntity.findOneOrFail({ where: { id: commentId }, relations: ['user'] });

    if (comment.user.id !== user.id) {
      throw new BadRequestException("You can't delete this comment");
    }
    return comment;
  }

  // update a comment
  async updateComment(commentId: string, comment: string, user: UserEntity) {
    try {
      const commentToUpdate = await this.checkUserOwnsComment(commentId, user);
      commentToUpdate.content = comment;
      await this.commentEntity.save(commentToUpdate);
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException(error, 'Can not update comment');
    }
  }
}
