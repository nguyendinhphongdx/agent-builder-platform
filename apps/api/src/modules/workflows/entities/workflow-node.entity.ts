import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Workflow } from './workflow.entity';
import { WorkflowNodeType } from '../enums/workflow.enums';

@Entity('workflow_nodes')
export class WorkflowNode extends BaseEntity {
  @Column({ type: 'uuid', name: 'workflow_id' })
  workflow_id!: string;

  @Column({ type: 'enum', enum: WorkflowNodeType })
  type!: WorkflowNodeType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  label?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'float', name: 'position_x', default: 0 })
  position_x!: number;

  @Column({ type: 'float', name: 'position_y', default: 0 })
  position_y!: number;

  @Column({ type: 'float', nullable: true })
  width?: number;

  @Column({ type: 'float', nullable: true })
  height?: number;

  @Column({ type: 'jsonb', nullable: true })
  config?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  style?: Record<string, any>;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sort_order!: number;

  @ManyToOne(() => Workflow, (w) => w.nodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflow_id' })
  workflow?: Workflow;
}
