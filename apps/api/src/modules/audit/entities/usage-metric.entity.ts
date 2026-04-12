import {
  Entity,
  Column,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MetricType } from '../enums/metric-type.enum';

@Entity('usage_metrics')
export class UsageMetric extends BaseEntity {
  @Column({ type: 'enum', enum: MetricType, name: 'metric_type' })
  metric_type!: MetricType;

  @Column({ type: 'float', name: 'metric_value' })
  metric_value!: number;

  @Column({ type: 'varchar', name: 'model_name', length: 100, nullable: true })
  model_name?: string;

  @Column({ type: 'uuid', name: 'agent_id', nullable: true })
  agent_id?: string;

  @Column({ type: 'date', name: 'recorded_date' })
  recorded_date!: Date;
}
