import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Agent } from './agent.entity';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum SharePermission {
  VIEW = 'view',
  USE = 'use',
  EDIT = 'edit',
  ADMIN = 'admin',
}

@Entity('agent_shares')
export class AgentShare extends BaseEntity {
  @Column({ type: 'uuid', name: 'agent_id' })
  agent_id!: string;

  @Column({ type: 'uuid', name: 'shared_with_user_id', nullable: true })
  shared_with_user_id?: string;

  @Column({ type: 'uuid', name: 'shared_with_tenant_id', nullable: true })
  shared_with_tenant_id?: string;

  @Column({ type: 'enum', enum: SharePermission, default: SharePermission.VIEW })
  permission!: SharePermission;

  @Column({ type: 'uuid', name: 'shared_by', nullable: true })
  shared_by?: string;

  @Column({ type: 'timestamp', name: 'expires_at', nullable: true })
  expires_at?: Date;

  @ManyToOne(() => Agent, (a) => a.shares)
  @JoinColumn({ name: 'agent_id' })
  agent?: Agent;
}
