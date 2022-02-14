import { customAlphabet } from 'nanoid';
import { BeforeInsert, CreateDateColumn, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AbstractDto } from './abstract.dto';

export abstract class AbstractEntity<DTO extends AbstractDto = AbstractDto, O = never> {
  @PrimaryColumn({ type: 'bigint' })
  id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @BeforeInsert()
  generateId() {
    const alphabet = '0123456789';
    const id = customAlphabet(alphabet, 8);
    this.id = (11000000000 + parseInt(id())).toString();
  }
}
