// import { CommentEntity } from 'src/post/entity/comment';
// import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
// import { LikeEntity } from './like';
// import { UserEntity } from '../../user/user';

// @Entity('posts')
// export class PostEntity {
//   @PrimaryGeneratedColumn('uuid')
//   id: number;

//   @Column()
//   description: string;

//   @Column()
//   image: string;

//   @ManyToOne(() => UserEntity, (user) => user.posts, { onDelete: 'CASCADE' })
//   user: UserEntity;

//   @OneToMany(() => LikeEntity, (likes) => likes.post)
//   likes: LikeEntity[];

//   @OneToMany(() => CommentEntity, (comment) => comment.post)
//   comments: CommentEntity[];

//   @CreateDateColumn()
//   created_at: Date;

//   @UpdateDateColumn()
//   updated_at: Date;
// }
