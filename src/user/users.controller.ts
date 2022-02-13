import { Body, Controller, Delete, Get, Logger, Param, Patch, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FriendRequestResponse } from '../common/constants/enum';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { UserInfo } from './dtos/user-info';
import { UserDto } from './dtos/user.dto';

import { UserService } from './users.service';

@ApiTags('User')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('user')
export class UsersController {
  private logger = new Logger(UsersController.name);
  constructor(private readonly userService: UserService) {}

  @ApiOkResponse({ description: 'Return user', type: UserDto })
  @Get()
  async getUser(@Query('userId') userId: string) {
    const user = await this.userService.getUserRelaFriendsById(userId);
    return user;
  }

  @ApiOkResponse({ description: 'Return all users', type: [UserDto] })
  @Get('/list-friends')
  async getUsers() {
    //TODO:
    const users = await this.userService.find({});
    return users;
  }

  @ApiOkResponse({ description: 'Detele all users for dev' })
  @Delete('/delete-all')
  async deleteAllUsers() {
    await this.userService.deleteAllUsers();
    return { message: 'All users deleted' };
  }

  // @Put('/follow')
  // async followUser(@Request() req, @Param('userId') userId: string) {
  //   return await this.userService.followUser(req.user, userId);
  // }

  // @Put('/unfollow')
  // async unfollowUser(@Request() req, @Param('userId') userId: string) {
  //   return await this.userService.unFollowUser(req.user, userId);
  // }

  // Change password
  @Patch('/password')
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    await this.userService.changePassword(req.user, dto);
    return { message: 'Đổi mật khẩu thành công' };
  }

  /**
   * Profile
   */

  // Update user information
  @Patch('/info')
  async changeInfo(@Request() req, @Body() infoDto: UserInfo) {
    return await this.userService.updateProfile(req.user, infoDto);
  }

  /**
   * Friends
   */

  @Post('/friend-request/send/:receiverId')
  async sendFriendRequest(@Request() req, @Param('receiverId') receiverId: string) {
    return await this.userService.sendFriendRequest(req.user, receiverId);
  }

  @ApiQuery({ name: 'statusResponse', enum: FriendRequestResponse })
  @Put('/friend-request/response/:requestId')
  async responseFriendRequest(
    @Request() req,
    @Query('statusResponse') statusResponse: FriendRequestResponse,
    @Param('requestId') requestId: string,
  ) {
    return await this.userService.responseFriendRequest(req.user, requestId, statusResponse);
  }

  @Get('/friend-request')
  async getFriendRequests(@Request() req) {
    return await this.userService.getFriendRequests(req.user);
  }

  @Get('/friends/:id')
  async getFriends(@Param('id') id: string) {
    return await this.userService.getFriends(id);
  }

  @Delete('/friends/:id')
  async deleteFriend(@Request() req, @Param('id') id: string) {
    return await this.userService.deleteFriend(req.user, id);
  }
  // suggestFriends
  // @Get('/suggestFriends')
  // async suggestFriends(@Request() req) {
  //   return await this.userService.suggestFriends(req.user);
  // }
}
