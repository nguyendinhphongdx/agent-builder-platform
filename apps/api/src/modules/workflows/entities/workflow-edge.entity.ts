import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Workflow } from './workflow.entity';

@Entity('workflow_edges')
export class WorkflowEdge extends BaseEntity {
  @Column({ type: 'uuid', name: 'workflow_id' })
  workflow_id!: string;

  @Column({ type: 'uuid', name: 'source_node_id' })
  source_node_id!: string;

  @Column({ type: 'uuid', name: 'target_node_id' })
  target_node_id!: string;

  @Column({ type: 'varchar', name: 'source_handle', length: 100, nullable: true })
  source_handle?: string;

  @Column({ type: 'varchar', name: 'target_handle', length: 100, nullable: true })
  target_handle?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  label?: string;

  @Column({ type: 'jsonb', nullable: true })
  condition?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  style?: Record<string, any>;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sort_order!: number;

  @ManyToOne(() => Workflow, (w) => w.edges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflow_id' })
  workflow?: Workflow;
}
