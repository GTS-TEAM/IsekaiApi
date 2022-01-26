import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Req, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CommentEntity } from 'src/post/entity/comment';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommentRequestDto } from './dto/comment.dto';
import { PostDto } from './dto/post-request.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { PostEntity } from './entity/post';
import { PostService } from './post.service';

@ApiTags('Post')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @ApiCreatedResponse({ description: 'Return 201 Created' })
  @Post('/')
  async createPost(@Body() postDto: PostDto, @Req() req) {
    return await this.postService.createPost(postDto, req.user);
  }

  @ApiOkResponse({ description: 'Return message deleted successfully' })
  @Delete('/:postId')
  async deletePost(@Param('postId') postId: string, @Request() req) {
    await this.postService.deletePost(postId, req.user);
    return {
      message: 'Post deleted successfully',
    };
  }

  @ApiOkResponse({ description: 'Return list of posts', type: PostResponseDto, isArray: true })
  @Get('/timeline')
  async getTimeline(@Request() req) {
    const posts = await this.postService.getUserTimeline(req.user);
    return posts;
  }

  @ApiOkResponse({ description: "Return user's post", type: PostResponseDto, isArray: true })
  @Get('/profile/:userId')
  async getUserPosts(@Param('userId') userId: string): Promise<PostEntity[]> {
    const posts = await this.postService.getUserPosts(userId);
    return posts;
  }

  @Patch('/:postId/like')
  async updatePostLikes(@Param('postId') postId: string, @Request() req) {
    await this.postService.likePost(postId, req.user);
  }

  /**
   * COMMENT
   */

  @Get('/:postId/comments')
  async getPostComments(@Param('postId') postId: string): Promise<CommentEntity[]> {
    const comments = await this.postService.getPostComments(postId);
    return comments;
  }

  @Post('/:postId/comments')
  async createComment(
    @Param('postId') postId: string,
    @Body() commentRequestDto: CommentRequestDto,
    @Request() req,
  ): Promise<void> {
    await this.postService.createComment(postId, req.user, commentRequestDto.comment);
  }

  // delete a comment
  @Delete('/comments/:commentId')
  async deleteComment(@Param('commentId') commentId: string, @Request() req) {
    await this.postService.deleteComment(commentId, req.user);
  }
  // update a comment
  @Patch('/comments/:commentId')
  async updateComment(@Param('commentId') commentId: string, @Body() commentRequestDto: CommentRequestDto, @Request() req) {
    await this.postService.updateComment(commentId, commentRequestDto.comment, req.user);
  }

  @Patch('/:postId')
  async updatePost(@Param('postId') postId: string, @Body() postDto: PostDto, @Request() req): Promise<PostEntity> {
    const post = await this.postService.checkUserOwnsPost(postId, req.user);
    const postPayload = await this.postService.updatePost(post, postDto);
    return postPayload;
  }

  // @ApiOkResponse({ description: 'Delele all posts for dev' })
  // @Delete('/delete-post-dev')
  // async deleteAllPost() {
  //   await this.postService.deleteAll();
  // }
}
