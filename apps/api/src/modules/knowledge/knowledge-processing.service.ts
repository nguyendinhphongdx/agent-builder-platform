import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AgentKnowledge,
  KnowledgeStatus,
} from '../agents/entities/agent-knowledge.entity';
import {
  TextProcessor,
  PdfProcessor,
  CsvProcessor,
  JsonProcessor,
  DocxProcessor,
} from './processors';
import { TextChunk } from './utils/chunker';
import * as path from 'path';

@Injectable()
export class KnowledgeProcessingService {
  private readonly logger = new Logger(KnowledgeProcessingService.name);

  private readonly textProcessor = new TextProcessor();
  private readonly pdfProcessor = new PdfProcessor();
  private readonly csvProcessor = new CsvProcessor();
  private readonly jsonProcessor = new JsonProcessor();
  private readonly docxProcessor = new DocxProcessor();

  constructor(
    @InjectRepository(AgentKnowledge)
    private readonly knowledgeRepo: Repository<AgentKnowledge>,
  ) {}

  async processFile(
    knowledgeId: string,
    filePath: string,
    fileType: string,
  ): Promise<void> {
    // 1. Update status to processing
    await this.knowledgeRepo.update(knowledgeId, {
      status: KnowledgeStatus.PROCESSING,
      error_message: undefined,
    });

    try {
      // 2. Route to correct processor based on file extension
      const ext = path.extname(filePath).toLowerCase();
      const chunks = await this.getChunks(ext, filePath);

      // 3. Update record with results
      await this.knowledgeRepo.update(knowledgeId, {
        status: KnowledgeStatus.READY,
        chunks_count: chunks.length,
        processed_at: new Date(),
      });

      this.logger.log(
        `Processed knowledge ${knowledgeId}: ${chunks.length} chunks from ${ext} file`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to process knowledge ${knowledgeId}: ${error.message}`,
      );
      await this.knowledgeRepo.update(knowledgeId, {
        status: KnowledgeStatus.FAILED,
        error_message: error.message || 'Processing failed',
      });
    }
  }

  private async getChunks(
    ext: string,
    filePath: string,
  ): Promise<TextChunk[]> {
    switch (ext) {
      case '.txt':
      case '.md':
      case '.log':
        return this.textProcessor.process(filePath);

      case '.pdf':
        return this.pdfProcessor.process(filePath);

      case '.csv':
        return this.csvProcessor.process(filePath);

      case '.json':
        return this.jsonProcessor.process(filePath);

      case '.docx':
        return this.docxProcessor.process(filePath);

      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }
}
