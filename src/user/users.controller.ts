import { Body, Controller, Delete, Get, Logger, Param, Patch, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserDto } from './dto/user.dto';

import { UserService } from './users.service';

export class ChangeInfoDto {
  @ApiProperty({ nullable: true })
  username?: string;

  @ApiProperty({ nullable: true })
  email?: string;

  @ApiProperty({ nullable: true })
  bio?: string;

  @ApiProperty({ nullable: true })
  avatar?: string;

  @ApiProperty({ nullable: true })
  background?: string;
}
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
  async changePassword(@Request() req, @Body() body: { password: string }) {
    return await this.userService.changePassword(req.user, body.password);
  }

  /**
   * Profile
   */

  // Update user information
  @Patch('/info')
  async changeInfo(@Request() req, @Body() infoDto: ChangeInfoDto) {
    return await this.userService.updateProfile(req.user, infoDto);
  }

  /**
   * Friends
   */

  @Post('/add-friend/:friendId')
  async addFriend(@Request() req, @Param('friendId') friendId: string) {
    return await this.userService.sendFriendRequest(req.user, friendId);
  }

  @Get('/add-friend/')
  async getFriendRequests(@Request() req) {
    return await this.userService.getFriendRequests(req.user);
  }

  // suggestFriends
  // @Get('/suggestFriends')
  // async suggestFriends(@Request() req) {
  //   return await this.userService.suggestFriends(req.user);
  // }
}
