import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './notification';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { UserModule } from '../user/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationEntity]), UserModule],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService, TypeOrmModule.forFeature([NotificationEntity])],
})
export class NotificationModule {}
