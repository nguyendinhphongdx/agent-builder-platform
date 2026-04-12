import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tenant } from './tenant.entity';

@Entity('tenant_llm_keys')
export class TenantLlmKey extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  provider!: string;

  @Column({ type: 'varchar', length: 255, name: 'display_name' })
  display_name!: string;

  @Column({ type: 'varchar', name: 'api_key_encrypted' })
  api_key_encrypted!: string;

  @Column({ type: 'varchar', name: 'base_url', nullable: true })
  base_url?: string;

  @Column({ type: 'varchar', name: 'org_id', nullable: true })
  org_id?: string;

  @Column({ type: 'boolean', name: 'is_default', default: false })
  is_default!: boolean;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  is_active!: boolean;

  @Column({ type: 'varchar', array: true, name: 'models_available', nullable: true })
  models_available?: string[];

  @Column({ type: 'jsonb', name: 'rate_limit', nullable: true })
  rate_limit?: Record<string, any>;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  created_by?: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.llm_keys, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  override toResponse(): Record<string, any> {
    const { api_key_encrypted, ...safe } = { ...this };
    return safe;
  }
}
