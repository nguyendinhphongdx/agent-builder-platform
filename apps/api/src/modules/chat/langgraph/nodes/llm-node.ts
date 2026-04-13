import OpenAI from 'openai';
import { AgentStateType } from '../state/agent-state';

export function createLlmNode(config: { litellmUrl: string; litellmKey: string }) {
  const client = new OpenAI({
    baseURL: `${config.litellmUrl}/v1`,
    apiKey: config.litellmKey,
  });

  return async (state: AgentStateType) => {
    const systemMessage = state.agentConfig.instructions
      ? { role: 'system' as const, content: state.agentConfig.instructions }
      : { role: 'system' as const, content: `You are ${state.agentConfig.name}, a helpful assistant.` };

    const messages = [systemMessage, ...state.messages];

    try {
      const response = await client.chat.completions.create({
        model: state.agentConfig.model,
        messages: messages as any,
        temperature: state.agentConfig.temperature,
        max_tokens: state.agentConfig.maxTokens,
      });

      const choice = response.choices[0];
      const assistantMessage: any = {
        role: 'assistant',
        content: choice.message.content || '',
      };

      if (choice.message.tool_calls?.length) {
        assistantMessage.tool_calls = choice.message.tool_calls;
        return {
          messages: [assistantMessage],
          isComplete: false,
        };
      }

      return {
        messages: [assistantMessage],
        output: choice.message.content || '',
        isComplete: true,
      };
    } catch (error: any) {
      return {
        messages: [{ role: 'assistant', content: `Error: ${error.message}` }],
        output: `Error: ${error.message}`,
        isComplete: true,
      };
    }
  };
}
