// import { UserEntity } from 'src/user/user';
// import {
//   Entity,
//   Column,
//   CreateDateColumn,
//   PrimaryGeneratedColumn,
//   ManyToOne,
//   JoinColumn,
// } from 'typeorm';

// @Entity('users_follow')
// export class UserFollowerEntity {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @ManyToOne((type) => UserEntity, (user) => user.followers)
//   followers: UserEntity;

//   @ManyToOne((type) => UserEntity, (user) => user.following)
//   following: UserEntity;
// }
