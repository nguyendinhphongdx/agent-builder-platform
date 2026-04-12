import { DataSource } from 'typeorm';

export async function seedBuiltinTools(dataSource: DataSource) {
  const toolRepo = dataSource.getRepository('tools');

  const builtinTools = [
    {
      name: 'Web Search',
      slug: 'web-search',
      description: 'Search the web using Google/Bing APIs',
      type: 'web_search',
      is_builtin: true,
      category: 'search',
      icon: 'search',
      is_active: true,
      config: { engine: 'google', max_results: 10, safe_search: true },
      input_schema: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    },
    {
      name: 'Database Query',
      slug: 'database-query',
      description: 'Execute SQL queries on connected databases',
      type: 'db_query',
      is_builtin: true,
      category: 'data',
      icon: 'database',
      is_active: true,
      config: { db_type: 'postgresql', read_only: true, timeout_ms: 30000 },
      input_schema: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    },
    {
      name: 'Code Executor',
      slug: 'code-executor',
      description: 'Execute Python or JavaScript code snippets',
      type: 'code',
      is_builtin: true,
      category: 'compute',
      icon: 'code',
      is_active: true,
      config: { language: 'python', timeout_ms: 30000, memory_limit_mb: 256 },
      input_schema: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          language: { type: 'string' },
        },
        required: ['code'],
      },
    },
    {
      name: 'HTTP Request',
      slug: 'http-request',
      description: 'Make HTTP requests to external APIs',
      type: 'http',
      is_builtin: true,
      category: 'integration',
      icon: 'globe',
      is_active: true,
      config: { timeout_ms: 30000 },
      input_schema: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          method: { type: 'string' },
          headers: { type: 'object' },
          body: { type: 'string' },
        },
        required: ['url'],
      },
    },
    {
      name: 'File Parser',
      slug: 'file-parser',
      description: 'Parse and extract content from files (PDF, DOCX, CSV)',
      type: 'file_parser',
      is_builtin: true,
      category: 'data',
      icon: 'file-text',
      is_active: true,
      config: {
        supported_formats: ['pdf', 'docx', 'csv', 'txt', 'json', 'md'],
        max_file_size_mb: 10,
      },
      input_schema: {
        type: 'object',
        properties: { file_url: { type: 'string' } },
        required: ['file_url'],
      },
    },
    {
      name: 'Email Sender',
      slug: 'email-sender',
      description: 'Send emails via SMTP',
      type: 'email',
      is_builtin: true,
      category: 'communication',
      icon: 'mail',
      is_active: true,
      config: { provider: 'smtp' },
      input_schema: {
        type: 'object',
        properties: {
          to: { type: 'string' },
          subject: { type: 'string' },
          body: { type: 'string' },
        },
        required: ['to', 'subject', 'body'],
      },
    },
    {
      name: 'Webhook',
      slug: 'webhook',
      description: 'Send data to webhook endpoints',
      type: 'webhook',
      is_builtin: true,
      category: 'integration',
      icon: 'webhook',
      is_active: true,
      config: { retry_count: 3 },
      input_schema: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          payload: { type: 'object' },
        },
        required: ['url'],
      },
    },
    {
      name: 'MCP Server',
      slug: 'mcp-server',
      description: 'Connect to Model Context Protocol servers',
      type: 'mcp_server',
      is_builtin: true,
      category: 'ai',
      icon: 'server',
      is_active: true,
      config: { transport: 'sse' },
      input_schema: {
        type: 'object',
        properties: {
          server_url: { type: 'string' },
          tool_name: { type: 'string' },
          args: { type: 'object' },
        },
        required: ['server_url', 'tool_name'],
      },
    },
  ];

  for (const tool of builtinTools) {
    const exists = await toolRepo.findOne({
      where: { slug: tool.slug, is_builtin: true },
    });
    if (!exists) {
      await toolRepo.save(toolRepo.create(tool));
    }
  }

  console.log('Built-in tools seeded successfully');
}
