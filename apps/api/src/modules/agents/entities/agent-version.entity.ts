import {
  Entity,
  Column,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('agent_versions')
export class AgentVersion extends BaseEntity {
  @Column({ type: 'uuid', name: 'agent_id' })
  agent_id!: string;

  @Column({ type: 'int' })
  version!: number;

  @Column({ type: 'jsonb' })
  snapshot!: Record<string, any>;

  @Column({ type: 'text', name: 'change_note', nullable: true })
  change_note?: string;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  created_by?: string;
}
