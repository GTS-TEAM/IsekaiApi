import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotiStatus, NotiType } from '../shared/constants/enum';
import { NotificationRequestDto } from './dto/notif-request.dto';
import { NotificationEntity } from './notification';
import { NotificationService } from './notification.service';

class NotificationDto {
  id: string;
  status: string;
  type: string;
  created_at: Date;
  updated_at: Date;
}

@ApiTags('Notification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller()
export class NotificationController {
  constructor(private readonly notifService: NotificationService) {}

  // get user notifications
  @Get('/notif')
  async getUserNotifications(@Request() req) {
    return await this.notifService.getUserNotifications(req.user);
  }

  // send notification to user
  @Post('/notif')
  async sendNotification(@Request() req, @Body() notifDto: NotificationRequestDto) {
    // type: add friend
    // status: pendding
    return await this.notifService.sendFriendRequest(req.user, notifDto);
  }

  @Patch('/notif/:id')
  async updateNotification(@Request() req, @Param('id') id: string) {
    // type: add friend
    // status: pendding
    // return await this.notifService.updateNotification(req.user, id);
  }
}
