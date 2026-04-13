import { AgentStateType } from '../state/agent-state';

export function createRouterNode() {
  return async (state: AgentStateType) => {
    // Simple routing for Super Agent mode
    // In a real implementation, this would analyze the message and delegate to sub-agents
    return {
      output: 'Routing not yet implemented - using direct response',
      isComplete: true,
    };
  };
}
