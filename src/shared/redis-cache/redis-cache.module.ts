// import { Module } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { RedisCacheService } from './redis-cache.service';
// import * as Redis from 'redis';
// @Module({
//   providers: [
//     {
//       provide: 'CacheService',
//       useFactory: (configService: ConfigService) => {
//         const redisClient = Redis.createClient({
//           host: configService.get('redis.host'),
//           port: configService.get('redis.port'),
//         });
//         return redisClient;
//       },
//       inject: [ConfigService],
//     },
//     RedisCacheService,
//   ],
//   exports: ['CacheService', RedisCacheService],
// })
// export class RedisCacheModule {}
