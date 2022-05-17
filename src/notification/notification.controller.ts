import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotiStatus, NotiType } from '../common/constants/enum';
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
@Controller('notif')
export class NotificationController {
  constructor(private readonly notifService: NotificationService) {}

  // get user notifications
  @Get('/')
  async getUserNotifications(@Request() req, @Param('page') page: number, @Param('limit') limit: number) {
    return await this.notifService.getUserNotifications(req.user, page, limit);
  }

  // send notification to user
  @Post('/')
  async sendNotification(@Request() req, @Body() notifDto: NotificationRequestDto) {
    // type: add friend
    // status: pendding
    return await this.notifService.sendFriendRequest(req.user, notifDto);
  }

  @Patch('/:id')
  async updateNotification(@Request() req, @Param('id') id: string) {
    // type: add friend
    // status: pendding
    return await this.notifService.readNotification(req.user, id);
  }
}
