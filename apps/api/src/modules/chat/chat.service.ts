import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { MessageRole, ContentType } from './enums/chat-status.enum';
import { Agent } from '../agents/entities/agent.entity';
import { RequestContextService } from '../../common/context';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionRepo: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
    @InjectRepository(Agent)
    private readonly agentRepo: Repository<Agent>,
    private readonly ctx: RequestContextService,
  ) {}

  async createSession(dto: CreateSessionDto): Promise<ChatSession> {
    const agent = await this.agentRepo.findOne({
      where: { id: dto.agentId, tenant_id: this.ctx.tenantId },
    });
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    const session = this.sessionRepo.create({
      tenant_id: this.ctx.tenantId,
      agent_id: dto.agentId,
      user_id: this.ctx.userId,
      title: `Chat with ${agent.name}`,
      is_preview: dto.isPreview ?? false,
    });

    return this.sessionRepo.save(session);
  }

  async getSession(sessionId: string): Promise<ChatSession> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, tenant_id: this.ctx.tenantId },
      relations: ['agent'],
    });
    if (!session) {
      throw new NotFoundException('Chat session not found');
    }
    return session;
  }

  async getMessages(sessionId: string, page = 1, limit = 50) {
    await this.getSession(sessionId);

    const [data, total] = await this.messageRepo.findAndCount({
      where: { session_id: sessionId, tenant_id: this.ctx.tenantId },
      order: { created_at: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async saveUserMessage(sessionId: string, content: string): Promise<ChatMessage> {
    const message = this.messageRepo.create({
      tenant_id: this.ctx.tenantId,
      session_id: sessionId,
      role: MessageRole.USER,
      content,
      content_type: ContentType.TEXT,
    });
    return this.messageRepo.save(message);
  }

  async saveAssistantMessage(sessionId: string, content: string, metadata?: Record<string, any>): Promise<ChatMessage> {
    const message = this.messageRepo.create({
      tenant_id: this.ctx.tenantId,
      session_id: sessionId,
      role: MessageRole.ASSISTANT,
      content,
      content_type: ContentType.MARKDOWN,
      metadata,
    });
    return this.messageRepo.save(message);
  }

  async updateSessionStats(sessionId: string, tokenCount: number): Promise<void> {
    await this.sessionRepo
      .createQueryBuilder()
      .update(ChatSession)
      .set({
        total_messages: () => 'total_messages + 2',
        total_tokens: () => `total_tokens + ${tokenCount}`,
        last_message_at: new Date(),
      })
      .where('id = :sessionId', { sessionId })
      .execute();
  }

  async getConversationHistory(sessionId: string, maxMessages = 20): Promise<ChatMessage[]> {
    return this.messageRepo.find({
      where: { session_id: sessionId },
      order: { created_at: 'DESC' },
      take: maxMessages,
    });
  }

  async *mockLLMStream(messages: any[], agentConfig: any): AsyncGenerator<string> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const lastMessage = messages[messages.length - 1];
    const response = `I'm ${agentConfig.name}, an AI assistant. You said: "${lastMessage?.content || ''}". I'm configured with ${agentConfig.instructions ? 'custom instructions' : 'default settings'}.`;
    const words = response.split(' ');
    for (const word of words) {
      yield word + ' ';
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    await this.sessionRepo.softRemove(session);
  }
}
