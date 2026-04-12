import {
  Entity,
  Column,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ExecutionLogStatus } from '../enums/workflow.enums';

@Entity('workflow_execution_logs')
export class WorkflowExecutionLog extends BaseEntity {
  @Column({ type: 'uuid', name: 'execution_id' })
  execution_id!: string;

  @Column({ type: 'uuid', name: 'node_id' })
  node_id!: string;

  @Column({ type: 'enum', enum: ExecutionLogStatus, default: ExecutionLogStatus.PENDING })
  status!: ExecutionLogStatus;

  @Column({ type: 'jsonb', nullable: true })
  input?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  output?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  error?: string;

  @Column({ type: 'int', name: 'duration_ms', nullable: true })
  duration_ms?: number;

  @Column({ type: 'int', name: 'tokens_used', default: 0 })
  tokens_used!: number;

  @Column({ type: 'int', name: 'retry_count', default: 0 })
  retry_count!: number;

  @Column({ type: 'timestamp', name: 'started_at', nullable: true })
  started_at?: Date;

  @Column({ type: 'timestamp', name: 'completed_at', nullable: true })
  completed_at?: Date;
}
