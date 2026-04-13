import { AgentStateType } from '../state/agent-state';

export function createToolNode() {
  return async (state: AgentStateType) => {
    const lastMessage = state.messages[state.messages.length - 1];
    const toolCalls = lastMessage?.tool_calls || [];
    const toolResults: any[] = [];

    for (const toolCall of toolCalls) {
      // Mock tool execution for now
      const result = {
        role: 'tool' as const,
        tool_call_id: toolCall.id,
        content: JSON.stringify({
          success: true,
          result: `Mock result for tool "${toolCall.function.name}" with args: ${toolCall.function.arguments}`,
        }),
      };
      toolResults.push(result);
    }

    return {
      messages: toolResults,
      toolResults,
    };
  };
}
