import { Injectable } from '@nestjs/common';
import { ToolExecutionResult, ToolExecutor } from './base.executor';
import { HttpExecutor } from './http.executor';
import { CodeExecutor } from './code.executor';
import { DbQueryExecutor } from './db-query.executor';
import { WebSearchExecutor } from './web-search.executor';
import { McpServerExecutor } from './mcp-server.executor';
import { FileParserExecutor } from './file-parser.executor';
import { EmailExecutor } from './email.executor';
import { WebhookExecutor } from './webhook.executor';

@Injectable()
export class ToolExecutorService {
  private executors: Map<string, ToolExecutor>;

  constructor() {
    this.executors = new Map<string, ToolExecutor>([
      ['http', new HttpExecutor()],
      ['code', new CodeExecutor()],
      ['db_query', new DbQueryExecutor()],
      ['web_search', new WebSearchExecutor()],
      ['mcp_server', new McpServerExecutor()],
      ['file_parser', new FileParserExecutor()],
      ['email', new EmailExecutor()],
      ['webhook', new WebhookExecutor()],
    ]);
  }

  async execute(toolType: string, config: any, input: any): Promise<ToolExecutionResult> {
    const executor = this.executors.get(toolType);
    if (!executor) {
      return {
        success: false,
        output: null,
        error: `Unknown tool type: ${toolType}`,
        durationMs: 0,
      };
    }
    return executor.execute(config, input);
  }
}
