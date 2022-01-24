import { Body, Controller, Delete, Get, Param, Post, Put, Req, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CommentEntity } from 'src/post/entity/comment';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostDto } from './dto/post-request.dto';
import { PostEntity } from './entity/post';
import { PostService } from './post.service';

@ApiTags('Post')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @ApiOkResponse({ description: 'Return 201 Created' })
  @Post('/')
  async createPost(@Body() postDto: PostDto, @Req() req) {
    await this.postService.createPost(postDto, req.user);
  }

  @ApiOkResponse({ description: 'Return message deleted successfully' })
  @Delete('/:postId')
  async deletePost(@Param('postId') postId: string, @Request() req) {
    await this.postService.deletePost(postId, req.user);
    return {
      message: 'Post deleted successfully',
    };
  }

  @Get('/timeline')
  async getTimeline(@Request() req): Promise<PostEntity[]> {
    const posts = await this.postService.getUserTimeline(req.user);
    return posts;
  }

  @Get('/profile/:userId')
  async getUserPosts(@Param('userId') userId: string): Promise<PostEntity[]> {
    const posts = await this.postService.getUserPosts(userId);
    return posts;
  }

  @Put('/:postId/like')
  updatePostLikes(@Param('postId') postId: string, @Request() req): Promise<PostEntity> {
    return this.postService.likePost(postId, req.user);
  }

  @Get('/:postId/comments')
  async getPostComments(@Param('postId') postId: string): Promise<CommentEntity[]> {
    const comments = await this.postService.getPostComments(postId);
    return comments;
  }

  // check if user liked post
  @Get('/:postId/isLiked')
  async checkIfUserLikedPost(@Param('postId') postId: string, @Request() req): Promise<boolean> {
    const isLiked = await this.postService.checkUserLikedPost(postId, req.user.id);
    return isLiked;
  }

  // comment
  @Post('/:postId/comments')
  async createComment(@Param('postId') postId: string, @Body() body: any, @Request() req): Promise<void> {
    await this.postService.createComment(postId, req.user, body.comment);
  }

  @Put('/:postId')
  async updatePost(@Param('postId') postId: string, @Body() postDto: PostDto, @Request() req): Promise<PostEntity> {
    const post = await this.postService.checkUserOwnsPost(postId, req.user);
    const postPayload = await this.postService.updatePost(post, postDto);
    return postPayload;
  }

  @Delete('/delete-post')
  async deleteAllPost() {
    await this.postService.deleteAll();
  }
}
