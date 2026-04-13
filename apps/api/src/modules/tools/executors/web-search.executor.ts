import axios from 'axios';
import { ToolExecutor, ToolExecutionResult } from './base.executor';

export class WebSearchExecutor implements ToolExecutor {
  async execute(config: Record<string, any>, input: Record<string, any>): Promise<ToolExecutionResult> {
    const start = Date.now();

    try {
      const query: string = input.query || input.q || config.default_query || '';
      if (!query) {
        return {
          success: false,
          output: null,
          error: 'No search query provided. Pass "query" in input.',
          durationMs: Date.now() - start,
        };
      }

      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
      const response = await axios.get(url, { timeout: config.timeout_ms || 10000 });
      const data = response.data;

      const results: any[] = [];

      if (data.Abstract) {
        results.push({
          type: 'abstract',
          text: data.Abstract,
          source: data.AbstractSource,
          url: data.AbstractURL,
        });
      }

      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        for (const topic of data.RelatedTopics.slice(0, 10)) {
          if (topic.Text) {
            results.push({
              type: 'related',
              text: topic.Text,
              url: topic.FirstURL || null,
            });
          } else if (topic.Topics && Array.isArray(topic.Topics)) {
            for (const sub of topic.Topics.slice(0, 3)) {
              if (sub.Text) {
                results.push({
                  type: 'related',
                  text: sub.Text,
                  url: sub.FirstURL || null,
                });
              }
            }
          }
        }
      }

      return {
        success: true,
        output: {
          query,
          heading: data.Heading || null,
          abstract: data.Abstract || null,
          results,
          resultCount: results.length,
        },
        durationMs: Date.now() - start,
      };
    } catch (error: any) {
      return {
        success: false,
        output: null,
        error: error.message || 'Web search failed',
        durationMs: Date.now() - start,
      };
    }
  }
}
