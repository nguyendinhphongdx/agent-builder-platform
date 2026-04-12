import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { UsageMetric } from './entities/usage-metric.entity';
import { MetricType } from './enums/metric-type.enum';
import { RequestContextService } from '../../common/context';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
    @InjectRepository(UsageMetric)
    private readonly usageMetricRepo: Repository<UsageMetric>,
    private readonly ctx: RequestContextService,
  ) {}

  /**
   * Fire-and-forget audit log entry
   */
  log(action: string, entityType: string, entityId?: string, changes?: Record<string, any>): void {
    const entry = this.auditLogRepo.create({
      tenant_id: this.ctx.tenantId,
      user_id: this.ctx.userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      changes,
      ip_address: this.ctx.ipAddress,
      user_agent: this.ctx.userAgent,
    });

    this.auditLogRepo.save(entry).catch((err) => {
      this.logger.error(`Failed to save audit log: ${err.message}`);
    });
  }

  /**
   * Record a usage metric
   */
  recordMetric(metricType: MetricType, metricValue: number, modelName?: string, agentId?: string): void {
    const metric = this.usageMetricRepo.create({
      tenant_id: this.ctx.tenantId,
      metric_type: metricType,
      metric_value: metricValue,
      model_name: modelName,
      agent_id: agentId,
      recorded_date: new Date(),
    });

    this.usageMetricRepo.save(metric).catch((err) => {
      this.logger.error(`Failed to save usage metric: ${err.message}`);
    });
  }
}
