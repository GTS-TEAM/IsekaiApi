import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AbstractEntity } from '../common/abstract.entity';
import { TokenType } from '../common/constants/enum';
import { UserEntity } from '../user/user';
@Entity()
export class Tokens extends AbstractEntity {
  @Column()
  token: string;

  @Column({ enum: TokenType, type: 'enum' })
  type: TokenType;

  @Column({ default: true })
  active: boolean;

  @ManyToOne(() => UserEntity, (user) => user.token, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  user: UserEntity;
}
