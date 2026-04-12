import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { AuditableEntity } from '../../../common/entities/auditable.entity';
import { User } from '../../users/entities/user.entity';
import { AgentStatus } from '../enums/agent-status.enum';
import { AgentMode } from '../enums/agent-mode.enum';
import { AgentVisibility } from '../enums/agent-visibility.enum';
import { AgentKnowledge } from './agent-knowledge.entity';
import { AgentTool } from './agent-tool.entity';
import { AgentCollaborator } from './agent-collaborator.entity';
import { AgentShare } from './agent-share.entity';

@Entity('agents')
@Unique(['tenant_id', 'slug'])
export class Agent extends AuditableEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  instructions?: string;

  @Column({ type: 'varchar', name: 'avatar_url', nullable: true })
  avatar_url?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon?: string;

  @Column({ type: 'enum', enum: AgentStatus, default: AgentStatus.DRAFT })
  status!: AgentStatus;

  @Column({ type: 'enum', enum: AgentMode, default: AgentMode.INDEPENDENT })
  mode!: AgentMode;

  @Column({ type: 'enum', enum: AgentVisibility, default: AgentVisibility.PRIVATE })
  visibility!: AgentVisibility;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column({ type: 'jsonb', name: 'model_config', nullable: true })
  model_config?: Record<string, any>;

  @Column({ type: 'text', name: 'welcome_message', nullable: true })
  welcome_message?: string;

  @Column({ type: 'varchar', array: true, nullable: true })
  tags?: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'int', name: 'usage_count', default: 0 })
  usage_count!: number;

  @Column({ type: 'uuid', name: 'creator_id', nullable: true })
  creator_id?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'creator_id' })
  creator?: User;

  @OneToMany(() => AgentKnowledge, (k) => k.agent)
  knowledge?: AgentKnowledge[];

  @OneToMany(() => AgentTool, (t) => t.agent)
  tools?: AgentTool[];

  @OneToMany(() => AgentCollaborator, (c) => c.parent_agent)
  collaborators?: AgentCollaborator[];

  @OneToMany(() => AgentShare, (s) => s.agent)
  shares?: AgentShare[];
}
