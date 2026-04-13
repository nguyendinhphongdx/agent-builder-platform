import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeProcessingService } from './knowledge-processing.service';
import { AgentKnowledge } from '../agents/entities/agent-knowledge.entity';
import { Agent } from '../agents/entities/agent.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AgentKnowledge, Agent]),
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
  ],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, KnowledgeProcessingService],
  exports: [KnowledgeService, KnowledgeProcessingService],
})
export class KnowledgeModule {}
