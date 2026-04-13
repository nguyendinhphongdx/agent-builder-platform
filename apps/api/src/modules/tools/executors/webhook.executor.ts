import axios from 'axios';
import { ToolExecutor, ToolExecutionResult } from './base.executor';

export class WebhookExecutor implements ToolExecutor {
  async execute(config: Record<string, any>, input: Record<string, any>): Promise<ToolExecutionResult> {
    const start = Date.now();

    try {
      const url: string = config.url || '';
      if (!url) {
        return {
          success: false,
          output: null,
          error: 'No webhook URL configured',
          durationMs: Date.now() - start,
        };
      }

      const retryCount: number = config.retry_count || 0;
      const timeout: number = config.timeout_ms || 10000;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(config.headers || {}),
      };

      if (config.secret) {
        headers['X-Webhook-Secret'] = config.secret;
      }

      let lastError: any = null;

      for (let attempt = 0; attempt <= retryCount; attempt++) {
        try {
          const response = await axios.post(url, input, { headers, timeout });

          return {
            success: true,
            output: {
              status: response.status,
              statusText: response.statusText,
              data: response.data,
              attempt: attempt + 1,
            },
            durationMs: Date.now() - start,
          };
        } catch (error: any) {
          lastError = error;
          // Only retry on 5xx or network errors
          if (error.response && error.response.status < 500 && attempt < retryCount) {
            break;
          }
        }
      }

      return {
        success: false,
        output: null,
        error: lastError?.response
          ? `Webhook failed with HTTP ${lastError.response.status}: ${lastError.response.statusText}`
          : lastError?.message || 'Webhook request failed',
        durationMs: Date.now() - start,
      };
    } catch (error: any) {
      return {
        success: false,
        output: null,
        error: error.message || 'Webhook execution failed',
        durationMs: Date.now() - start,
      };
    }
  }
}
