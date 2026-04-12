import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Agent } from './agent.entity';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum KnowledgeStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

@Entity('agent_knowledge')
export class AgentKnowledge extends BaseEntity {
  @Column({ type: 'uuid', name: 'agent_id' })
  agent_id!: string;

  @Column({ type: 'varchar', name: 'file_name', length: 500 })
  file_name!: string;

  @Column({ type: 'varchar', name: 'file_type', length: 100 })
  file_type!: string;

  @Column({ type: 'bigint', name: 'file_size' })
  file_size!: number;

  @Column({ type: 'varchar', name: 'file_url', length: 1000 })
  file_url!: string;

  @Column({ type: 'varchar', name: 'content_hash', length: 255, nullable: true })
  content_hash?: string;

  @Column({ type: 'enum', enum: KnowledgeStatus, default: KnowledgeStatus.PENDING })
  status!: KnowledgeStatus;

  @Column({ type: 'int', name: 'chunks_count', default: 0 })
  chunks_count!: number;

  @Column({ type: 'text', name: 'error_message', nullable: true })
  error_message?: string;

  @Column({ type: 'timestamp', name: 'processed_at', nullable: true })
  processed_at?: Date;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  created_by?: string;

  @ManyToOne(() => Agent, (a) => a.knowledge)
  @JoinColumn({ name: 'agent_id' })
  agent?: Agent;
}
