import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AbstractEntity } from '../common/abstract.entity';
import { UserDto } from '../user/dtos/user.dto';
import { UserEntity } from '../user/user';

@Entity('musics')
export class MusicEntity extends AbstractEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true })
  author: string;

  @ManyToOne(() => UserEntity, (user) => user.musics)
  uploader: UserEntity;

  @Column({ nullable: true })
  duration: number;

  @Column()
  url: string;

  @OneToMany(() => UserEntity, (user) => user.favoriteMusics)
  favoriteUsers: UserEntity[];
}
