import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('refresh_tokens')
export class RefreshToken extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  user_id!: string;

  @Column({ type: 'varchar', name: 'token_hash' })
  token_hash!: string;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expires_at!: Date;

  @Column({ type: 'boolean', name: 'is_revoked', default: false })
  is_revoked!: boolean;

  @ManyToOne(() => User, (user) => user.refresh_tokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  override toResponse(): Record<string, any> {
    const { token_hash, ...safe } = { ...this };
    return safe;
  }
}
