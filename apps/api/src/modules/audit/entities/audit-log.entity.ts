import {
  Entity,
  Column,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('audit_logs')
export class AuditLog extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  user_id?: string;

  @Column({ type: 'varchar', length: 100 })
  action!: string;

  @Column({ type: 'varchar', name: 'entity_type', length: 100 })
  entity_type!: string;

  @Column({ type: 'uuid', name: 'entity_id', nullable: true })
  entity_id?: string;

  @Column({ type: 'jsonb', nullable: true })
  changes?: Record<string, any>;

  @Column({ type: 'varchar', name: 'ip_address', length: 45, nullable: true })
  ip_address?: string;

  @Column({ type: 'text', name: 'user_agent', nullable: true })
  user_agent?: string;
}
