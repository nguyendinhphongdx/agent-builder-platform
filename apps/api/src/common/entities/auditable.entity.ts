import { Column } from 'typeorm';
import { BaseEntity } from './base.entity';

export abstract class AuditableEntity extends BaseEntity {
  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  created_by?: string;

  @Column({ type: 'uuid', name: 'updated_by', nullable: true })
  updated_by?: string;
}
