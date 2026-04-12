import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tenant } from './tenant.entity';
import { User } from '../../users/entities/user.entity';

export enum TenantRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

@Entity('tenant_members')
export class TenantMember extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  user_id!: string;

  @Column({ type: 'enum', enum: TenantRole, default: TenantRole.MEMBER })
  role!: TenantRole;

  @Column({ type: 'uuid', name: 'invited_by', nullable: true })
  invited_by?: string;

  @Column({ type: 'timestamp', name: 'joined_at', nullable: true })
  joined_at?: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @ManyToOne(() => User, (user) => user.tenant_memberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
