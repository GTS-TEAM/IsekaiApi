import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationEntity } from './notification';
import { NotificationService } from './notification.service';

class NotificationDto {
  id: string;
  status: string;
  type: string;
  created_at: Date;
  updated_at: Date;
}

class NotificationRequestDto {
  @ApiProperty()
  notif: NotificationEntity;

  @ApiProperty()
  friendId: string;
}

@ApiTags('Notification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('notif')
export class NotificationController {
  constructor(private readonly notifService: NotificationService) {}

  // get user notifications
  @Get('/')
  async getUserNotifications(@Request() req) {
    return await this.notifService.getUserNotifications(req.user);
  }

  // send notification to user
  @Post('/')
  async sendNotification(@Request() req, @Body() notifDto: NotificationRequestDto) {
    // type: add friend
    // status: pendding
    return await this.notifService.sendNotification(req.user, notifDto.friendId, notifDto.notif);
  }
}
