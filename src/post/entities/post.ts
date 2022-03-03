import { CommentEntity } from 'src/post/entities/comment';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { UserEntity } from '../../user/user';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractEntity } from '../../common/abstract.entity';

@Entity('posts')
export class PostEntity extends AbstractEntity {
  @ApiProperty()
  @Column()
  description: string;

  @ApiProperty()
  @Column('simple-array', { nullable: true })
  image?: string[];

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
}
