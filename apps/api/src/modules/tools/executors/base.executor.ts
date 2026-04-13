export interface ToolExecutionResult {
  success: boolean;
  output: any;
  error?: string;
  durationMs: number;
}

export interface ToolExecutor {
  execute(config: Record<string, any>, input: Record<string, any>): Promise<ToolExecutionResult>;
}
