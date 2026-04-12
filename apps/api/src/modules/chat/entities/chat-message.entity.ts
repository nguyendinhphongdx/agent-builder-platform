import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ChatSession } from './chat-session.entity';
import { MessageRole, ContentType } from '../enums/chat-status.enum';

@Entity('chat_messages')
export class ChatMessage extends BaseEntity {
  @Column({ type: 'uuid', name: 'session_id' })
  session_id!: string;

  @Column({ type: 'uuid', name: 'parent_message_id', nullable: true })
  parent_message_id?: string;

  @Column({ type: 'enum', enum: MessageRole })
  role!: MessageRole;

  @Column({ type: 'text' })
  content!: string;

  @Column({
    type: 'enum',
    enum: ContentType,
    name: 'content_type',
    default: ContentType.TEXT,
  })
  content_type!: ContentType;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  feedback?: Record<string, any>;

  @ManyToOne(() => ChatSession, (s) => s.messages)
  @JoinColumn({ name: 'session_id' })
  session?: ChatSession;

  @ManyToOne(() => ChatMessage, { nullable: true })
  @JoinColumn({ name: 'parent_message_id' })
  parent_message?: ChatMessage;
}
