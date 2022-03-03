import { customAlphabet } from 'nanoid';
import { BeforeInsert, CreateDateColumn, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AbstractDto } from './abstract.dto';
import * as utils from '../common/utils/generate-id';

export abstract class AbstractEntity<DTO extends AbstractDto = AbstractDto, O = never> {
  @PrimaryColumn({ type: 'bigint' })
  id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @BeforeInsert()
  generateId() {
    this.id = utils.generateId(8, { constraint: 11000000000 });
  }
}
