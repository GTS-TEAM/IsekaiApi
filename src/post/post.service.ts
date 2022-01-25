import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, In, Repository } from 'typeorm';
import { UserEntity } from '../user/user';
import { PostDto } from './dto/post-request.dto';
import { PostEntity } from './entity/post';
import { LikeEntity } from 'src/post/entity/like';
import { CommentEntity } from 'src/post/entity/comment';
import { PostFields } from 'src/shared/constants/enum';

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

  createPost(post: PostDto, user: UserEntity): Promise<PostEntity> {
    try {
      const postEntity = this.postEntity.create(post);
      postEntity.user = user;
      return this.postEntity.save(postEntity);
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException('Can not create post, try again later');
    }
  }

  async deleteAll() {}

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
      await this.commentEntity.save(newComment);

      post.comments.push(newComment);
      await this.postEntity.save(post);
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Can not create comment');
    }
  }

  // get post comments
  async getPostComments(postId: string) {
    try {
      const comments = await this.commentEntity
        .createQueryBuilder('comments')
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
      throw new BadRequestException();
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

  async getUserTimeline(user: UserEntity) {
    try {
      const postsSnapshot = await this.postEntity
        .createQueryBuilder('posts')
        .leftJoinAndSelect('posts.user', 'user')
        .loadRelationCountAndMap('posts.comments', 'posts.comments')
        .loadRelationCountAndMap('posts.likes', 'posts.likes')
        .getMany();
      // check if user already liked post
      const post = await this.checkLikedAndReturnPosts(postsSnapshot, user.id);
      return post;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Can not get post');
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
  async getUserPosts(userId: string) {
    try {
      const post = await this.postEntity
        .createQueryBuilder('posts')
        .select(['posts', 'user.id'])
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
      throw new BadRequestException();
    }
    return post;
  }

  async seedPosts(post: PostDto, user: UserEntity) {
    await this.createPost(post, user);
    return 'Seeded post successfully';
  }
}
