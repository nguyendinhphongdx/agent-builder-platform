import axios from 'axios';
import { ToolExecutor, ToolExecutionResult } from './base.executor';

export class HttpExecutor implements ToolExecutor {
  async execute(config: Record<string, any>, input: Record<string, any>): Promise<ToolExecutionResult> {
    const start = Date.now();

    try {
      let url: string = config.url || '';
      let body: any = config.body_template || null;
      const method: string = (config.method || 'GET').toUpperCase();
      const timeout: number = config.timeout_ms || 30000;
      const headers: Record<string, string> = { ...(config.headers || {}) };

      // Replace {{variable}} placeholders in URL
      url = this.replacePlaceholders(url, input);

      // Replace {{variable}} placeholders in body
      if (body && typeof body === 'string') {
        body = this.replacePlaceholders(body, input);
        try {
          body = JSON.parse(body);
        } catch {
          // keep as string if not valid JSON
        }
      } else if (body && typeof body === 'object') {
        body = JSON.parse(this.replacePlaceholders(JSON.stringify(body), input));
      }

      // Handle authentication
      const authType: string = config.auth_type || 'none';
      const authConfig: Record<string, any> = config.auth_config || {};

      switch (authType) {
        case 'api_key':
          headers[authConfig.header_name || 'X-API-Key'] = authConfig.api_key || '';
          break;
        case 'bearer':
          headers['Authorization'] = `Bearer ${authConfig.token || ''}`;
          break;
        case 'basic': {
          const credentials = Buffer.from(
            `${authConfig.username || ''}:${authConfig.password || ''}`,
          ).toString('base64');
          headers['Authorization'] = `Basic ${credentials}`;
          break;
        }
        case 'none':
        default:
          break;
      }

      const response = await axios({
        method,
        url,
        headers,
        data: ['POST', 'PUT', 'PATCH'].includes(method) ? body : undefined,
        timeout,
      });

      return {
        success: true,
        output: {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
          headers: response.headers,
        },
        durationMs: Date.now() - start,
      };
    } catch (error: any) {
      return {
        success: false,
        output: null,
        error: error.response
          ? `HTTP ${error.response.status}: ${error.response.statusText}`
          : error.message || 'HTTP request failed',
        durationMs: Date.now() - start,
      };
    }
  }

  private replacePlaceholders(template: string, input: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return input[key] !== undefined ? String(input[key]) : `{{${key}}}`;
    });
  }
}
