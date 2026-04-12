import {
  Entity,
  Column,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ExecutionStatus } from '../enums/workflow.enums';

@Entity('workflow_executions')
export class WorkflowExecution extends BaseEntity {
  @Column({ type: 'uuid', name: 'workflow_id' })
  workflow_id!: string;

  @Column({ type: 'int', name: 'workflow_version' })
  workflow_version!: number;

  @Column({ type: 'enum', enum: ExecutionStatus, default: ExecutionStatus.PENDING })
  status!: ExecutionStatus;

  @Column({ type: 'varchar', name: 'trigger_type', length: 100, nullable: true })
  trigger_type?: string;

  @Column({ type: 'jsonb', nullable: true })
  input?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  output?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  variables?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  error?: Record<string, any>;

  @Column({ type: 'int', name: 'duration_ms', nullable: true })
  duration_ms?: number;

  @Column({ type: 'int', name: 'total_tokens_used', default: 0 })
  total_tokens_used!: number;

  @Column({ type: 'decimal', name: 'total_cost', precision: 10, scale: 6, default: 0 })
  total_cost!: number;

  @Column({ type: 'uuid', name: 'triggered_by', nullable: true })
  triggered_by?: string;

  @Column({ type: 'timestamp', name: 'started_at', nullable: true })
  started_at?: Date;

  @Column({ type: 'timestamp', name: 'completed_at', nullable: true })
  completed_at?: Date;
}
