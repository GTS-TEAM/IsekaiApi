import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { RolesEnum } from '../shared/constants/enum';
import { Tokens } from '../token/token.entity';
import { classToPlain, Exclude } from 'class-transformer';
// import { PostEntity } from '../post/entity/post';
// import { LikeEntity } from '../post/entity/like';
// import { CommentEntity } from 'src/post/entity/comment';
// import { UserFollowerEntity } from 'src/user/user-follow';
// import { ConversationEntity } from 'src/conversation/entity/conversation';
// import { MessageEntity } from 'src/conversation/entity/message';
@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({ enum: RolesEnum, type: 'enum', default: RolesEnum.USER })
  roles: RolesEnum;

  @Column({ default: '' })
  profilePicture: string;

  // @OneToMany(() => UserFollowerEntity, (uf) => uf.following)
  // followers: UserFollowerEntity[];

  // @OneToMany(() => UserFollowerEntity, (uf) => uf.followers)
  // following: UserFollowerEntity[];

  // @OneToMany(() => PostEntity, (post) => post.user, { onDelete: 'CASCADE' })
  // posts: PostEntity[];

  // @OneToMany(() => PostEntity, (post) => post.likes, { onDelete: 'CASCADE' })
  // likes: LikeEntity[];

  // @OneToMany(() => CommentEntity, (comment) => comment.user)
  // comments: CommentEntity[];

  @OneToMany(() => Tokens, (token) => token.user)
  token: Tokens[];

  // @Column({ default: false })
  // emailVerified: boolean;

  // @ManyToMany(() => ConversationEntity, (conversation) => conversation.members)
  // conversations: ConversationEntity[];

  // @OneToMany(() => MessageEntity, (message) => message.sender)
  // messages: MessageEntity[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  toJSON() {
    return classToPlain(this);
  }

  @BeforeInsert()
  hashPassword() {
    const salt = bcrypt.genSaltSync();
    this.password = bcrypt.hashSync(this.password, salt);
  }
}
