import {
  Entity,
  Column,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum CredentialType {
  API_KEY = 'api_key',
  OAUTH2 = 'oauth2',
  BASIC = 'basic',
  BEARER = 'bearer',
  CUSTOM = 'custom',
}

@Entity('tool_credentials')
export class ToolCredential extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'enum', enum: CredentialType })
  type!: CredentialType;

  @Column({ type: 'text', name: 'encrypted_value' })
  encrypted_value!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'timestamp', name: 'expires_at', nullable: true })
  expires_at?: Date;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  created_by?: string;

  override toResponse(): Record<string, any> {
    const { encrypted_value, ...safe } = { ...this };
    return safe;
  }
}
