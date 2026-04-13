import { ToolExecutor, ToolExecutionResult } from './base.executor';

export class DbQueryExecutor implements ToolExecutor {
  async execute(config: Record<string, any>, input: Record<string, any>): Promise<ToolExecutionResult> {
    const start = Date.now();

    try {
      const dbType: string = config.db_type || 'postgresql';
      const queryTemplate: string = config.query_template || '';
      const readOnly: boolean = config.read_only !== false;

      // Replace {{variable}} placeholders in query
      const preparedQuery = queryTemplate.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        const value = input[key];
        if (value === undefined) return `{{${key}}}`;
        // Basic SQL escaping for safety
        if (typeof value === 'string') {
          return `'${value.replace(/'/g, "''")}'`;
        }
        return String(value);
      });

      return {
        success: true,
        output: {
          db_type: dbType,
          read_only: readOnly,
          prepared_query: preparedQuery,
          note: 'Query prepared but not executed - DB connection not configured',
        },
        durationMs: Date.now() - start,
      };
    } catch (error: any) {
      return {
        success: false,
        output: null,
        error: error.message || 'DB query preparation failed',
        durationMs: Date.now() - start,
      };
    }
  }
}
