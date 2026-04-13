import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AgentKnowledge,
  KnowledgeStatus,
} from '../agents/entities/agent-knowledge.entity';
import { Agent } from '../agents/entities/agent.entity';
import { RequestContextService } from '../../common/context';
import { KnowledgeProcessingService } from './knowledge-processing.service';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'knowledge');

  constructor(
    @InjectRepository(AgentKnowledge)
    private readonly knowledgeRepo: Repository<AgentKnowledge>,
    @InjectRepository(Agent)
    private readonly agentRepo: Repository<Agent>,
    private readonly ctx: RequestContextService,
    private readonly processingService: KnowledgeProcessingService,
  ) {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(
    agentId: string,
    files: Express.Multer.File[],
  ): Promise<AgentKnowledge[]> {
    const agent = await this.agentRepo.findOne({
      where: { id: agentId, tenant_id: this.ctx.tenantId },
    });
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    const records: AgentKnowledge[] = [];

    for (const file of files) {
      const hash = crypto
        .createHash('md5')
        .update(file.buffer)
        .digest('hex');

      const ext = path.extname(file.originalname);
      const fileName = `${agentId}/${hash}${ext}`;
      const filePath = path.join(this.uploadDir, agentId);

      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath, { recursive: true });
      }

      const fullPath = path.join(filePath, `${hash}${ext}`);
      fs.writeFileSync(fullPath, file.buffer);

      const record = this.knowledgeRepo.create({
        tenant_id: this.ctx.tenantId,
        agent_id: agentId,
        file_name: file.originalname,
        file_type: file.mimetype,
        file_size: file.size,
        file_url: `/uploads/knowledge/${fileName}`,
        content_hash: hash,
        status: KnowledgeStatus.PENDING,
        created_by: this.ctx.userId,
      });

      const saved = await this.knowledgeRepo.save(record);
      records.push(saved);

      // Process file immediately (synchronous for now, async via RabbitMQ later)
      this.processingService
        .processFile(saved.id, fullPath, file.mimetype)
        .catch((err) =>
          this.logger.error(
            `Background processing failed for ${saved.id}: ${err.message}`,
          ),
        );
    }

    return records;
  }

  async findAll(agentId: string) {
    return this.knowledgeRepo.find({
      where: { tenant_id: this.ctx.tenantId, agent_id: agentId },
      order: { created_at: 'DESC' },
    });
  }

  async remove(
    agentId: string,
    fileId: string,
  ): Promise<void> {
    const record = await this.knowledgeRepo.findOne({
      where: { id: fileId, tenant_id: this.ctx.tenantId, agent_id: agentId },
    });
    if (!record) {
      throw new NotFoundException('Knowledge file not found');
    }

    await this.knowledgeRepo.softRemove(record);
  }
}
