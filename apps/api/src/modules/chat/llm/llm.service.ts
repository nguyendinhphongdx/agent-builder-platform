import { Injectable, Optional, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { TenantLlmKeysService } from '../../auth/tenant-llm-keys.service';

@Injectable()
export class LlmService {
  constructor(
    private readonly configService: ConfigService,
    @Optional() @Inject(TenantLlmKeysService) private readonly tenantLlmKeyService?: TenantLlmKeysService,
  ) {}

  getClient(): OpenAI {
    const litellmUrl = this.configService.get('LITELLM_URL', 'http://localhost:4000');
    const litellmKey = this.configService.get('LITELLM_KEY', 'sk-litellm-master-key');
    return new OpenAI({ baseURL: `${litellmUrl}/v1`, apiKey: litellmKey });
  }

  async getClientForAgent(agentModelConfig: any): Promise<OpenAI> {
    const provider = agentModelConfig?.provider || 'openai';

    // Try to find tenant's key for this provider
    if (this.tenantLlmKeyService) {
      const tenantKey = await this.tenantLlmKeyService.findByProvider(provider);

      if (tenantKey) {
        return new OpenAI({
          baseURL: tenantKey.base_url || this.getProviderBaseUrl(provider),
          apiKey: this.tenantLlmKeyService.decryptKey(tenantKey.api_key_encrypted),
        });
      }
    }

    // Fallback to LiteLLM proxy
    return this.getClient();
  }

  private getProviderBaseUrl(provider: string): string {
    const urls: Record<string, string> = {
      openai: 'https://api.openai.com/v1',
      anthropic: 'https://api.anthropic.com/v1',
      google: 'https://generativelanguage.googleapis.com/v1beta',
    };
    return urls[provider] || 'https://api.openai.com/v1';
  }

  async *streamCompletion(
    model: string,
    messages: Array<{ role: string; content: string }>,
    options?: { temperature?: number; maxTokens?: number; tools?: any[] },
  ): AsyncGenerator<{ type: 'token' | 'tool_call' | 'done' | 'error'; data: any }> {
    const client = this.getClient();
    try {
      const stream = await client.chat.completions.create({
        model,
        messages: messages as OpenAI.ChatCompletionMessageParam[],
        stream: true as const,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
        ...(options?.tools?.length ? { tools: options.tools } : {}),
      });
      const toolCalls: Array<{ id: string; function: { name: string; arguments: string } }> = [];

      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta;
        const finishReason = chunk.choices?.[0]?.finish_reason;

        if (delta?.content) {
          yield { type: 'token', data: { delta: delta.content } };
        }
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            if (tc.index !== undefined) {
              if (!toolCalls[tc.index]) {
                toolCalls[tc.index] = { id: tc.id || '', function: { name: '', arguments: '' } };
              }
              if (tc.id) toolCalls[tc.index].id = tc.id;
              if (tc.function?.name) toolCalls[tc.index].function.name = tc.function.name;
              if (tc.function?.arguments) toolCalls[tc.index].function.arguments += tc.function.arguments;
            }
          }
        }
        if (finishReason === 'tool_calls') {
          for (const tc of toolCalls) {
            yield { type: 'tool_call', data: { id: tc.id, name: tc.function.name, arguments: JSON.parse(tc.function.arguments || '{}') } };
          }
        }
        if (finishReason === 'stop') {
          yield { type: 'done', data: { usage: chunk.usage || null } };
        }
      }
    } catch (error: any) {
      yield { type: 'error', data: { message: error.message || 'LLM error' } };
    }
  }

  async complete(
    model: string,
    messages: Array<{ role: string; content: string }>,
    options?: { temperature?: number; maxTokens?: number },
  ): Promise<string> {
    const client = this.getClient();
    const response = await client.chat.completions.create({
      model,
      messages: messages as any,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
    });
    return response.choices[0]?.message?.content || '';
  }
}
