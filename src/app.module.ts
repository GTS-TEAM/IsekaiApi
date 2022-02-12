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
import { SearchModule } from './search/search.module';
import { MusicModule } from './music/music.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    TypeOrmModule.forRootAsync({ useClass: DatabaseConfig }),
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
    MusicModule,
  ],
  providers: [AppService],
  controllers: [],
})
export class AppModule {}
