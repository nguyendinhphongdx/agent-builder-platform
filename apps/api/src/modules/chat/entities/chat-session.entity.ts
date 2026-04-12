import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Agent } from '../../agents/entities/agent.entity';
import { User } from '../../users/entities/user.entity';
import { ChatMessage } from './chat-message.entity';
import { ChatSessionStatus } from '../enums/chat-status.enum';

@Entity('chat_sessions')
export class ChatSession extends BaseEntity {
  @Column({ type: 'uuid', name: 'agent_id' })
  agent_id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  user_id!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  title?: string;

  @Column({ type: 'boolean', name: 'is_preview', default: false })
  is_preview!: boolean;

  @Column({
    type: 'enum',
    enum: ChatSessionStatus,
    default: ChatSessionStatus.ACTIVE,
  })
  status!: ChatSessionStatus;

  @Column({ type: 'jsonb', nullable: true })
  context?: Record<string, any>;

  @Column({ type: 'int', name: 'total_messages', default: 0 })
  total_messages!: number;

  @Column({ type: 'int', name: 'total_tokens', default: 0 })
  total_tokens!: number;

  @Column({ type: 'timestamp', name: 'last_message_at', nullable: true })
  last_message_at?: Date;

  @ManyToOne(() => Agent)
  @JoinColumn({ name: 'agent_id' })
  agent?: Agent;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @OneToMany(() => ChatMessage, (m) => m.session)
  messages?: ChatMessage[];
}
