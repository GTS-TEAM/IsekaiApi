import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TokenType } from '../shared/constants/enum';
import { UserEntity } from '../user/user';
@Entity()
export class Tokens {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column()
  token: string;

  @Column({ enum: TokenType, type: 'enum' })
  type: TokenType;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => UserEntity, (user) => user.token, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  user: UserEntity;

  @UpdateDateColumn()
  updated_at: Date;
}
