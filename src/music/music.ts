import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '../user/user';

@Entity('musics')
export class MusicEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

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

  @CreateDateColumn()
  create_at: Date;
}
