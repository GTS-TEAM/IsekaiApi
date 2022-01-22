import { Module } from '@nestjs/common';
import { MailService } from '@sendgrid/mail';
import { EmailService } from './email.service';

@Module({
  providers: [MailService, EmailService],
  exports: [EmailService, MailService],
})
export class EmailModule {}
