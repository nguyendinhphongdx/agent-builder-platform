import { StateGraph, END, START } from '@langchain/langgraph';
import { AgentState } from './state/agent-state';
import { createLlmNode } from './nodes/llm-node';
import { createToolNode } from './nodes/tool-node';

export function buildAgentGraph(config: { litellmUrl: string; litellmKey: string }) {
  const graph = new StateGraph(AgentState)
    .addNode('llm', createLlmNode(config))
    .addNode('tools', createToolNode())
    .addEdge(START, 'llm')
    .addConditionalEdges('llm', (state) => {
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage?.tool_calls?.length > 0) {
        return 'tools';
      }
      return END;
    })
    .addEdge('tools', 'llm');

  return graph.compile();
}
