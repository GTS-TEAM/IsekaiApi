import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  PrimaryColumn,
} from 'typeorm';
import { customAlphabet } from 'nanoid';
import * as bcrypt from 'bcryptjs';
import { RolesEnum } from '../shared/constants/enum';
import { Tokens } from '../token/token.entity';
import { classToPlain, Exclude } from 'class-transformer';
import { PostEntity } from '../post/entity/post';
import { CommentEntity } from 'src/post/entity/comment';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationEntity } from '../notification/notification';
// import { UserFollowerEntity } from 'src/user/user-follow';
import { ConversationEntity } from 'src/conversation/entity/conversation';
import { MessageEntity } from 'src/conversation/entity/message';

@Entity('users')
export class UserEntity {
  @ApiProperty()
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string;

  @ApiProperty()
  @Column()
  username: string;

  @ApiProperty()
  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @ApiProperty()
  @Column({ enum: RolesEnum, type: 'enum', default: RolesEnum.USER })
  roles: RolesEnum;

  @ApiProperty()
  @Column({ nullable: true })
  profilePicture?: string;

  @ApiProperty()
  @Column({ nullable: true })
  background?: string;

  @ApiProperty()
  @Column({ default: false })
  online: boolean;

  @ApiProperty()
  @Column({ nullable: true })
  bio: string;

  // @OneToMany(() => UserFollowerEntity, (uf) => uf.following)
  // followers: UserFollowerEntity[];

  // @OneToMany(() => UserFollowerEntity, (uf) => uf.followers)
  // following: UserFollowerEntity[];

  // friend
  @ManyToMany(() => UserEntity, (user) => user.friends)
  friends: UserEntity[];

  @OneToMany(() => NotificationEntity, (user) => user.receiver)
  notifications: NotificationEntity[];

  @OneToMany(() => PostEntity, (post) => post.user, { onDelete: 'CASCADE' })
  posts: PostEntity[];

  @ManyToMany(() => PostEntity, (post) => post.likes, { onDelete: 'CASCADE' })
  likes: PostEntity[];

  @OneToMany(() => CommentEntity, (comment) => comment.user)
  comments: CommentEntity[];

  @OneToMany(() => Tokens, (token) => token.user)
  token: Tokens[];

  // @Column({ default: false })
  // emailVerified: boolean;

  @ManyToMany(() => ConversationEntity, (conversation) => conversation.members)
  conversations: ConversationEntity[];

  @OneToMany(() => MessageEntity, (message) => message.sender)
  messages: MessageEntity[];

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @Exclude({ toPlainOnly: true })
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

  @BeforeInsert()
  generateId() {
    const alphabet = '0123456789';
    const id = customAlphabet(alphabet, 8);
    this.id = (11000000000 + parseInt(id())).toString();
  }
}
