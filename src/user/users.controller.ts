import { Body, Controller, Delete, Get, Logger, Param, Patch, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserDto } from './dto/user.dto';

import { UserService } from './users.service';
@ApiTags('User')
// @UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('user')
export class UsersController {
  private logger = new Logger(UsersController.name);
  constructor(private readonly userService: UserService) {}

  @ApiOkResponse({ description: 'Return user', type: UserDto })
  @Get()
  async getUser(@Query('userId') userId: string) {
    const user = await this.userService.getOneUser(userId);
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

  // @Put('/:userId/follow')
  // async followUser(@Request() req, @Param('userId') userId: string) {
  //   return await this.userService.followUser(req.user, userId);
  // }

  // @Put('/:userId/unfollow')
  // async unfollowUser(@Request() req, @Param('userId') userId: string) {
  //   return await this.userService.unFollowUser(req.user, userId);
  // }

  // Change password
  @Patch('/:userId/password')
  async changePassword(@Request() req, @Body() body: { password: string }) {
    return await this.userService.changePassword(req.user, body.password);
  }

  /**
   * Profile
   */

  // Change user avatar
  @Put('/:userId/avatar')
  async changeAvatar(@Request() req, @Body() body) {
    return await this.userService.changeAvatar(req.user, body.avatar);
  }

  //Change user name
  @Patch('/:userId/name')
  async changeName(@Request() req, @Body() body) {
    return await this.userService.changeName(req.user, body.name);
  }

  // Change bio
  @Patch('/:userId/bio')
  async changeBio(@Request() req, @Body() body: { bio: string }) {
    return await this.userService.changeBio(req.user, body.bio);
  }

  // Change background
  @Patch('/:userId/background')
  async changeBackground(@Request() req, @Body() body: { background: string }) {
    return await this.userService.changeBackground(req.user, body.background);
  }

  /**
   * END
   */

  // @Post('addFriend')
  // async addFriend(@Request() req, @Param('friendId') friendId: string) {
  //   await this.userService.addFriend(req.user, friendId);
  // }
}
