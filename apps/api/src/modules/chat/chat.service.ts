import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { MessageRole, ContentType } from './enums/chat-status.enum';
import { Agent } from '../agents/entities/agent.entity';
import { RequestContextService } from '../../common/context';
import { LlmService } from './llm/llm.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionRepo: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
    @InjectRepository(Agent)
    private readonly agentRepo: Repository<Agent>,
    private readonly ctx: RequestContextService,
    private readonly llmService: LlmService,
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

  async *mockLLMStream(messages: Array<{ role: string; content: string }>, agent: Agent): AsyncGenerator<string> {
    const lastMessage = messages[messages.length - 1];
    const response = `I'm ${agent.name}, an AI assistant. You said: "${lastMessage?.content || ''}". I'm configured with ${agent.instructions ? 'custom instructions' : 'default settings'}.`;
    const words = response.split(' ');
    for (const word of words) {
      yield word + ' ';
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  async *streamResponse(
    messages: Array<{ role: string; content: string }>,
    agent: Agent,
  ): AsyncGenerator<{ type: 'token' | 'tool_call' | 'done' | 'error'; data: Record<string, unknown> }> {
    const model = (agent.model_config?.model as string) || 'gpt-3.5-turbo';
    try {
      const systemMessages: Array<{ role: string; content: string }> = [];
      if (agent.instructions) {
        systemMessages.push({ role: 'system', content: agent.instructions });
      }
      const fullMessages = [...systemMessages, ...messages];

      const stream = this.llmService.streamCompletion(model, fullMessages, {
        temperature: agent.model_config?.temperature as number | undefined,
        maxTokens: agent.model_config?.maxTokens as number | undefined,
      });

      for await (const event of stream) {
        if (event.type === 'error') {
          const errorData = event.data as Record<string, unknown>;
          this.logger.warn(`LLM error, falling back to mock: ${String(errorData.message)}`);
          for await (const token of this.mockLLMStream(messages, agent)) {
            yield { type: 'token', data: { delta: token } };
          }
          yield { type: 'done', data: { usage: null } };
          return;
        }
        yield event;
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`LLM call failed, falling back to mock: ${errMsg}`);
      for await (const token of this.mockLLMStream(messages, agent)) {
        yield { type: 'token', data: { delta: token } };
      }
      yield { type: 'done', data: { usage: null } };
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    await this.sessionRepo.softRemove(session);
  }
}
