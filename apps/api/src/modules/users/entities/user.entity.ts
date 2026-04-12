import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { TenantMember } from '../../auth/entities/tenant-member.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', name: 'password_hash' })
  password_hash!: string;

  @Column({ type: 'varchar', length: 255, name: 'full_name' })
  full_name!: string;

  @Column({ type: 'varchar', name: 'avatar_url', nullable: true })
  avatar_url?: string;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  is_active!: boolean;

  @Column({ type: 'timestamp', name: 'last_login_at', nullable: true })
  last_login_at?: Date;

  @OneToMany(() => TenantMember, (member) => member.user)
  tenant_memberships?: TenantMember[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refresh_tokens?: RefreshToken[];

  override toResponse(): Record<string, unknown> {
    const response = { ...this } as Record<string, unknown>;
    delete response.password_hash;
    delete response.refresh_tokens;
    return response;
  }
}
