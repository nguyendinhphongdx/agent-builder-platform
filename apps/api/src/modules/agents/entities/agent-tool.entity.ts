import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Agent } from './agent.entity';
import { Tool } from '../../tools/entities/tool.entity';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('agent_tools')
@Unique(['agent_id', 'tool_id'])
export class AgentTool extends BaseEntity {
  @Column({ type: 'uuid', name: 'agent_id' })
  agent_id!: string;

  @Column({ type: 'uuid', name: 'tool_id' })
  tool_id!: string;

  @Column({ type: 'jsonb', name: 'config_override', nullable: true })
  config_override?: Record<string, any>;

  @Column({ type: 'boolean', name: 'is_enabled', default: true })
  is_enabled!: boolean;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sort_order!: number;

  @ManyToOne(() => Agent, (a) => a.tools)
  @JoinColumn({ name: 'agent_id' })
  agent?: Agent;

  @ManyToOne(() => Tool)
  @JoinColumn({ name: 'tool_id' })
  tool?: Tool;
}
