import {
  Entity,
  Column,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('api_keys')
export class ApiKey extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  user_id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', name: 'key_hash' })
  key_hash!: string;

  @Column({ type: 'varchar', length: 10, name: 'key_prefix' })
  key_prefix!: string;

  @Column({ type: 'jsonb', nullable: true })
  scopes?: string[];

  @Column({ type: 'timestamp', name: 'expires_at', nullable: true })
  expires_at?: Date;

  @Column({ type: 'timestamp', name: 'last_used_at', nullable: true })
  last_used_at?: Date;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  is_active!: boolean;

  override toResponse(): Record<string, any> {
    const { key_hash, ...safe } = { ...this };
    return safe;
  }
}
