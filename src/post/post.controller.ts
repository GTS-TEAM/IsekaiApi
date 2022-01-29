import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CommentEntity } from 'src/post/entity/comment';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PhotoRouterType } from '../shared/constants/enum';
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

  @ApiCreatedResponse({ description: 'Return 201 Created', type: PostResponseDto })
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
  @Get('/timeline/:page')
  async getTimeline(@Request() req, @Query('page') page: number) {
    const posts = await this.postService.getUserTimeline(req.user, page);
    return posts;
  }

  @Patch('/:postId/like')
  async updatePostLikes(@Param('postId') postId: string, @Request() req) {
    await this.postService.likePost(postId, req.user);
  }

  @Get('/:postId/likes')
  async getPostLikes(@Param('postId') postId: string) {
    const users = await this.postService.getPostLikes(postId);
    return users;
  }

  /**
   * COMMENT
   */
  @Get('/:postId/comments')
  async getPostComments(@Param('postId') postId: string, @Query('offset') offset: number): Promise<CommentEntity[]> {
    const comments = await this.postService.getPostComments(postId, offset);
    return comments;
  }

  @Post('/:postId/comments')
  async createComment(@Param('postId') postId: string, @Body() commentRequestDto: CommentRequestDto, @Request() req) {
    return await this.postService.createComment(postId, req.user, commentRequestDto.comment);
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

  /**
   * Profile
   */

  @ApiOkResponse({ description: "Return user's post", type: PostResponseDto, isArray: true })
  @Get('/:userId')
  async getUserPosts(@Param('userId') userId: string, @Query('page') page: number): Promise<PostEntity[]> {
    const posts = await this.postService.getUserPosts(userId, page);
    return posts;
  }

  // Get user photos profile
  @ApiQuery({ name: 'type', enum: PhotoRouterType })
  @Get('/:userId/photos')
  async getUserPhotosProfile(@Param('userId') userId: string, @Query('type') type: PhotoRouterType) {
    return await this.postService.getUserPhotosProfile(userId, type);
  }

  /**
   * END
   */

  @ApiOkResponse({ description: 'Delele all posts for dev' })
  @Delete('/delete/allpost/fordev')
  async deleteAllPost() {
    await this.postService.deleteAllPost();
  }
}
