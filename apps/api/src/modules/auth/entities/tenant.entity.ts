import {
  Entity,
  Column,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { TenantMember } from './tenant-member.entity';
import { TenantLlmKey } from './tenant-llm-key.entity';

export enum TenantPlan {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

@Entity('tenants')
export class Tenant extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug!: string;

  @Column({ type: 'varchar', name: 'logo_url', nullable: true })
  logo_url?: string;

  @Column({ type: 'enum', enum: TenantPlan, default: TenantPlan.FREE })
  plan!: TenantPlan;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  settings?: Record<string, any>;

  @Column({ type: 'uuid', name: 'owner_id', nullable: true })
  owner_id?: string;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  is_active!: boolean;

  @OneToMany(() => TenantMember, (member) => member.tenant)
  members?: TenantMember[];

  @OneToMany(() => TenantLlmKey, (key) => key.tenant)
  llm_keys?: TenantLlmKey[];
}
