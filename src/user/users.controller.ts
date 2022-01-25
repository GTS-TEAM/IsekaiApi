import { Body, Controller, Delete, Get, Logger, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
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
  @Get('/all')
  async getUsers() {
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

  @Post('addFriend')
  async addFriend(@Request() req, @Param('friendId') friendId: string) {
    await this.userService.addFriend(req.user, friendId);
  }
}
