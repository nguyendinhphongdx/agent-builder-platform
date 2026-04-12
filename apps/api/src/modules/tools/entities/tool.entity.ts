import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AuditableEntity } from '../../../common/entities/auditable.entity';
import { User } from '../../users/entities/user.entity';
import { ToolType } from '../enums/tool-type.enum';

@Entity('tools')
export class Tool extends AuditableEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: ToolType })
  type!: ToolType;

  @Column({ type: 'boolean', name: 'is_builtin', default: false })
  is_builtin!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category?: string;

  @Column({ type: 'jsonb', nullable: true })
  config?: Record<string, any>;

  @Column({ type: 'jsonb', name: 'input_schema', nullable: true })
  input_schema?: Record<string, any>;

  @Column({ type: 'jsonb', name: 'output_schema', nullable: true })
  output_schema?: Record<string, any>;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon?: string;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  is_active!: boolean;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column({ type: 'varchar', name: 'credentials_ref', length: 255, nullable: true })
  credentials_ref?: string;

  @Column({ type: 'jsonb', name: 'rate_limit', nullable: true })
  rate_limit?: Record<string, any>;

  @Column({ type: 'int', name: 'usage_count', default: 0 })
  usage_count!: number;

  @Column({ type: 'uuid', name: 'creator_id', nullable: true })
  creator_id?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'creator_id' })
  creator?: User;
}
