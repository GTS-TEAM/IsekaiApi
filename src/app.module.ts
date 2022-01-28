import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from './app.service';
import { UsersModule } from './user/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { config } from './config/config';
import { DatabaseConfig } from './config/database.config';
import { PostModule } from './post/post.module';
import { UploadModule } from './upload/upload.module';
import { NotificationModule } from './notification/notification.module';
import { ChatModule } from './chat/chat.module';
import { EmailModule } from './email/email.module';
import { ConversationModule } from './conversation/conversation.module';
import { ChatGateway } from './chat/chat.gateway';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import path from 'path/win32';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    TypeOrmModule.forRootAsync({ useClass: DatabaseConfig }),
    WinstonModule.forRoot({
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          dirname: './log/debug/', //path to where save loggin result
          filename: 'debug.log', //name of file where will be saved logging result
          level: 'debug',
        }),
        new winston.transports.File({
          dirname: './log/info/',
          filename: 'info.log',
          level: 'info',
        }),
        new winston.transports.File({
          dirname: './log/error/',
          filename: 'error.log',
          level: 'error',
        }),
      ],
    }),
    UsersModule,
    AuthModule,
    PostModule,
    UploadModule,
    NotificationModule,
    // RedisCacheModule,
    ChatModule,
    EmailModule,
    ConversationModule,
  ],
  providers: [AppService, ChatGateway],
})
export class AppModule {}
