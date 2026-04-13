import { ToolExecutor, ToolExecutionResult } from './base.executor';

export class McpServerExecutor implements ToolExecutor {
  async execute(config: Record<string, any>, input: Record<string, any>): Promise<ToolExecutionResult> {
    const start = Date.now();

    const serverUrl: string = config.server_url || '';
    const toolName: string = config.tool_name || '';
    const transport: string = config.transport || 'stdio';

    return {
      success: true,
      output: {
        server_url: serverUrl,
        tool_name: toolName,
        transport,
        input,
        message: 'MCP connection not yet implemented. This executor is a stub ready for real MCP protocol integration.',
      },
      durationMs: Date.now() - start,
    };
  }
}
