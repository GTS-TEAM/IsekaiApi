import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from './app.service';
import { UserModule } from './user/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { config } from './config/config';
import { DatabaseConfig } from './config/database.config';
import { PostModule } from './post/post.module';
import { UploadModule } from './upload/upload.module';
import { NotificationModule } from './notification/notification.module';
import { EventModule } from './event/event.module';
import { EmailModule } from './email/email.module';
import { ConversationModule } from './conversation/conversation.module';
import { WinstonModule } from 'nest-winston';
import { SearchModule } from './search/search.module';
import * as winston from 'winston';
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
    UserModule,
    AuthModule,
    PostModule,
    UploadModule,
    NotificationModule,
    // RedisCacheModule,
    NotificationModule,
    EventModule,
    EmailModule,
    ConversationModule,
    SearchModule,
  ],
  providers: [AppService],
})
export class AppModule {}
