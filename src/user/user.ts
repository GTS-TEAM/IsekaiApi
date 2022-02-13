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
  JoinTable,
  OneToOne,
  ManyToOne,
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
import { FriendRequestEntity } from './entity/friend-request';
import { MusicEntity } from '../music/music';
import { hashPassword as hash } from '../shared/utils/hash-password';

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
  avatar: string;

  @ApiProperty()
  @Column({ nullable: true })
  background?: string;

  @ApiProperty()
  @Column({ default: false })
  online: boolean;

  @ApiProperty()
  @Column({ nullable: true })
  bio: string;

  @ApiProperty()
  @Column({ nullable: true })
  phone: string;

  @ApiProperty()
  @Column({ nullable: true })
  date: Date;

  @ApiProperty()
  @Column({ nullable: true })
  address: string;

  // @OneToMany(() => UserFollowerEntity, (uf) => uf.following)
  // followers: UserFollowerEntity[];

  // @OneToMany(() => UserFollowerEntity, (uf) => uf.followers)
  // following: UserFollowerEntity[];

  // friend
  @ManyToMany(() => UserEntity, (user) => user.friends)
  @JoinTable()
  friends: UserEntity[];

  @OneToMany(() => NotificationEntity, (user) => user.receiver)
  notifications: NotificationEntity[];

  @OneToMany(() => PostEntity, (post) => post.user, { onDelete: 'CASCADE' })
  posts: PostEntity[];

  @ManyToMany(() => PostEntity, (post) => post.likes, { onDelete: 'CASCADE' })
  liked: PostEntity[];

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

  @OneToMany(() => FriendRequestEntity, (friendRequest) => friendRequest.creator)
  receivedFriendRequests: FriendRequestEntity[];

  @OneToMany(() => FriendRequestEntity, (friendRequest) => friendRequest.receiver)
  sentFriendRequests: FriendRequestEntity[];

  @OneToMany(() => MusicEntity, (musicEntity) => musicEntity.uploader)
  musics: MusicEntity[];

  @ManyToOne(() => MusicEntity, (music) => music.favoriteUsers)
  favoriteMusics: MusicEntity;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  toJSON() {
    return classToPlain(this);
  }

  @BeforeInsert()
  hashPassword() {
    this.password = hash(this.password);
  }

  @BeforeInsert()
  generateId() {
    const alphabet = '0123456789';
    const id = customAlphabet(alphabet, 8);
    this.id = (11000000000 + parseInt(id())).toString();
  }
}
