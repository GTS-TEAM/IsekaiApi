import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './notification';
import { NotificationService } from './notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationEntity])],

  providers: [NotificationService],
  exports: [NotificationService, TypeOrmModule.forFeature([NotificationEntity])],
})
export class NotificationModule {}
