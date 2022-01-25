import { CommentEntity } from 'src/post/entity/comment';
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { LikeEntity } from './like';
import { UserEntity } from '../../user/user';
import { ApiProperty } from '@nestjs/swagger';

@Entity('posts')
export class PostEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  description: string;

  @ApiProperty()
  @Column('simple-array')
  image: string[];

  @ApiProperty({ type: () => UserEntity })
  @ManyToOne(() => UserEntity, (user) => user.posts, { onDelete: 'CASCADE' })
  user: UserEntity;

  @ApiProperty()
  @OneToMany(() => LikeEntity, (likes) => likes.post)
  likes: LikeEntity[];

  @ApiProperty()
  @OneToMany(() => CommentEntity, (comment) => comment.post)
  comments: CommentEntity[];

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
