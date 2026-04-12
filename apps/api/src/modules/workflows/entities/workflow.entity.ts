import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { AuditableEntity } from '../../../common/entities/auditable.entity';
import { User } from '../../users/entities/user.entity';
import { WorkflowNode } from './workflow-node.entity';
import { WorkflowEdge } from './workflow-edge.entity';
import { WorkflowStatus } from '../enums/workflow.enums';

@Entity('workflows')
export class Workflow extends AuditableEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: WorkflowStatus, default: WorkflowStatus.DRAFT })
  status!: WorkflowStatus;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column({ type: 'varchar', array: true, nullable: true })
  tags?: string[];

  @Column({ type: 'jsonb', name: 'trigger_config', nullable: true })
  trigger_config?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  variables?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  viewport?: Record<string, any>;

  @Column({ type: 'uuid', name: 'creator_id', nullable: true })
  creator_id?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'creator_id' })
  creator?: User;

  @OneToMany(() => WorkflowNode, (n) => n.workflow, { cascade: true })
  nodes?: WorkflowNode[];

  @OneToMany(() => WorkflowEdge, (e) => e.workflow, { cascade: true })
  edges?: WorkflowEdge[];
}
