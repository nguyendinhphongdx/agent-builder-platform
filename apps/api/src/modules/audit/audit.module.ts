import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditLog } from './entities/audit-log.entity';
import { UsageMetric } from './entities/usage-metric.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, UsageMetric])],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
