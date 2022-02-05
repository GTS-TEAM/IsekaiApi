import { CommentEntity } from 'src/post/entity/comment';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
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

  @ApiProperty({ nullable: true })
  @ManyToMany(() => UserEntity, (likes) => likes.liked, { onDelete: 'CASCADE' })
  @JoinTable()
  likes: UserEntity[];

  @ApiProperty({ nullable: true })
  @OneToMany(() => CommentEntity, (comment) => comment.post, { onDelete: 'CASCADE' })
  comments: CommentEntity[];

  @ApiProperty({ nullable: true })
  @Column({ nullable: true })
  emoji: number;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
