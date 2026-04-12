import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Agent } from './agent.entity';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('agent_collaborators')
@Unique(['parent_agent_id', 'child_agent_id'])
export class AgentCollaborator extends BaseEntity {
  @Column({ type: 'uuid', name: 'parent_agent_id' })
  parent_agent_id!: string;

  @Column({ type: 'uuid', name: 'child_agent_id' })
  child_agent_id!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  role?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', name: 'delegation_rules', nullable: true })
  delegation_rules?: Record<string, any>;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sort_order!: number;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  is_active!: boolean;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  created_by?: string;

  @ManyToOne(() => Agent, (a) => a.collaborators)
  @JoinColumn({ name: 'parent_agent_id' })
  parent_agent?: Agent;

  @ManyToOne(() => Agent)
  @JoinColumn({ name: 'child_agent_id' })
  child_agent?: Agent;
}
