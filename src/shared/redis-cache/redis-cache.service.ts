// import { Inject, Injectable, Logger } from '@nestjs/common';
// import { createClient, RedisClient } from 'redis';
// import { PostFields } from 'src/shared/constants/enum';

// import { PostEntity } from 'src/post/entity/post';
// import { gzip, unzipSync } from 'zlib';

// @Injectable()
// export class RedisCacheService {
//   private readonly logger = new Logger(RedisCacheService.name);
//   constructor(@Inject('CacheService') private cacheManager: RedisClient) {}

//   async setPost(key: string, post: PostEntity) {
//     // set mot post
//     this.cacheManager.hset(
//       key, // 'post:' + post.id
//       'id',
//       post.id.toString(),
//       'description',
//       post.description,
//       'likes',
//       post.likes.toString(),
//       'comments',
//       post.comments.toString(),
//       'create_at',
//       post.created_at.toString(),
//       'user',
//       JSON.stringify(post.user),
//       'image',
//       post.image,
//     );
//   }

//   /**
//    *
//    * @param field field của entity
//    * @param post
//    * @param count neu user da~ like post thi count = -1 nguoc lai count = 1
//    */
//   async updatePost(field: PostFields, post: PostEntity, count?: number) {
//     switch (field) {
//       case PostFields.description:
//         this.cacheManager.hset('post:' + post.id, 'description', post.description);
//         break;
//       case PostFields.likes || PostFields.comments:
//         const postField = field === PostFields.likes ? PostFields.likes : PostFields.comments;
//         this.cacheManager.hincrby('post:' + post.id, postField, count);
//         break;
//     }
//   }

//   async getUserPosts(userId: string, cb: () => Promise<PostEntity[]>) {
//     return new Promise((resolve, reject) => {
//       this.cacheManager.lrange('user_posts:' + userId, 0, -1, async (err, postsId) => {
//         if (err) {
//           return reject(err);
//         }
//         if (postsId.length > 0) {
//           const data = await Promise.all(
//             postsId.map(async (element) => {
//               const post = await this.getPostFromRedis(element);
//               return post;
//             }),
//           );
//           resolve(data);
//         } else {
//           // lay cac post cua user
//           const posts = await cb();

//           /** day cac id cua post vao redis su dung key user_posts:userId
//            * de lay ra nhung post cua user */
//           posts.forEach((p) => {
//             this.cacheManager.rpush('user_posts:' + userId, p.id.toString());
//             this.setPost('post:' + p.id, p);
//           });
//           resolve(posts);
//         }
//       });
//     });
//   }

//   async getPostFromRedis(key) {
//     try {
//       return new Promise((resolve, reject) => {
//         // lay post tu redis bang id
//         this.cacheManager.hgetall('post:' + key, async (err, reply) => {
//           if (err) {
//             return reject(err);
//           }
//           const { id, description, likes, comments, image, create_at, user } = reply;
//           resolve({
//             id,
//             description,
//             likes: parseInt(likes),
//             create_at: Date.parse(create_at),
//             comments: parseInt(comments),
//             user: JSON.parse(user),
//             image,
//           });
//         });
//       });
//     } catch (error) {
//       this.logger.error(error);
//     }
//   }

//   async compressAndSetToRedis(key, data) {
//     try {
//       gzip(JSON.stringify(data), async (error, result) => {
//         if (error) {
//           throw error;
//         }
//         // this.cacheManager.rpush(key, result);
//       });
//     } catch (error) {
//       throw error;
//     }
//   }

//   unzipFromRedis(data) {
//     const unzip = data.map((buffer) => {
//       const unzip = unzipSync(buffer);
//       return JSON.parse(unzip.toString());
//     });
//     return unzip;
//   }

//   async setOrGetCacheList(key, cb: () => Promise<any>) {
//     return new Promise((resolve, reject) => {
//       this.cacheManager.lrange(key, 0, -1, async (err, reply) => {
//         if (err) {
//           return reject(err);
//         }
//         if (reply.length > 0) {
//           const entity = this.unzipFromRedis(reply);

//           return resolve(entity);
//         }
//         const resultDB = await cb();
//         this.cacheManager.expire(key, 3600);

//         resultDB.forEach((element) => {
//           this.compressAndSetToRedis(key, element);
//         });
//         resolve(resultDB);
//       });
//     });
//   }

//   async setOrGetCacheListNotZip(key, cb: () => Promise<any>) {
//     return new Promise((resolve, reject) => {
//       this.cacheManager.lrange(key, 0, -1, async (err, reply) => {
//         if (err) {
//           return reject(err);
//         }
//         if (reply.length > 0) {
//           return resolve(reply);
//         }
//         const resultDB = await cb();
//         this.cacheManager.expire(key, 3600);

//         this.cacheManager.rpush(
//           key,
//           resultDB.map((i) => {
//             JSON.stringify(i);
//           }),
//         );
//         // resultDB.forEach((element) => {
//         // });
//         resolve(resultDB);
//       });
//     });
//   }

//   setOneToRedis = (key, data) => {
//     const result = this.cacheManager.get(`${key}_${data._id}`);
//     JSON.stringify(result);
//   };

//   getPostById = async (key, cb) => {
//     return new Promise(async (resolve, reject) => {
//       let result;
//       this.cacheManager.get(key, async (err, data: string) => {
//         if (err) reject(err);
//         if (data) {
//           result = JSON.parse(data);
//         } else {
//           result = await cb();
//         }
//         this.setOneToRedis(key, result);
//         resolve(result);
//       });
//     });
//   };

//   async setToRedis(key, cb): Promise<any> {
//     const data = await cb();

//     return new Promise((resolve, reject) => {
//       // nếu đã tồn tại key posts (Redis đã có dữ liệu) thì append vào list trong redis
//       if (this.cacheManager.exists(key)) {
//         this.compressAndSetToRedis(key, data);
//       }
//       // set đơn để get bằng id
//       this.setOneToRedis(key, data);
//       resolve(data);
//     });
//   }

//   findIndexItemInListRedis(item) {
//     this.cacheManager;
//   }
// }
