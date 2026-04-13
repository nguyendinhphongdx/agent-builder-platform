import { Annotation } from '@langchain/langgraph';

export const AgentState = Annotation.Root({
  messages: Annotation<any[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  agentConfig: Annotation<{
    name: string;
    instructions: string;
    model: string;
    temperature: number;
    maxTokens: number;
    tools: any[];
  }>({
    reducer: (_, next) => next,
    default: () => ({
      name: 'Assistant',
      instructions: '',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 4096,
      tools: [],
    }),
  }),
  toolResults: Annotation<any[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  output: Annotation<string>({
    reducer: (_, next) => next,
    default: () => '',
  }),
  isComplete: Annotation<boolean>({
    reducer: (_, next) => next,
    default: () => false,
  }),
});

export type AgentStateType = typeof AgentState.State;
