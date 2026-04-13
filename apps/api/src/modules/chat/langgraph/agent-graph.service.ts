import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildAgentGraph } from './agent-graph';

@Injectable()
export class AgentGraphService {
  constructor(private readonly configService: ConfigService) {}

  async executeAgent(
    agentConfig: {
      name: string;
      instructions?: string;
      model_config?: { model?: string; temperature?: number; max_tokens?: number };
      tools?: any[];
    },
    messages: Array<{ role: string; content: string }>,
  ): Promise<{ response: string; toolCalls: any[]; usage: any }> {
    try {
      const graph = buildAgentGraph({
        litellmUrl: this.configService.get('LITELLM_URL', 'http://localhost:4000'),
        litellmKey: this.configService.get('LITELLM_KEY', 'sk-litellm-master-key'),
      });

      const result = await graph.invoke({
        messages,
        agentConfig: {
          name: agentConfig.name,
          instructions: agentConfig.instructions || '',
          model: agentConfig.model_config?.model || 'gpt-4o-mini',
          temperature: agentConfig.model_config?.temperature || 0.7,
          maxTokens: agentConfig.model_config?.max_tokens || 4096,
          tools: agentConfig.tools || [],
        },
      });

      return {
        response: result.output,
        toolCalls: result.toolResults,
        usage: null,
      };
    } catch (error: any) {
      return {
        response: `Error executing agent: ${error.message}`,
        toolCalls: [],
        usage: null,
      };
    }
  }
}
