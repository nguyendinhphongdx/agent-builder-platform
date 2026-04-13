import * as vm from 'node:vm';
import { ToolExecutor, ToolExecutionResult } from './base.executor';

export class CodeExecutor implements ToolExecutor {
  async execute(config: Record<string, any>, input: Record<string, any>): Promise<ToolExecutionResult> {
    const start = Date.now();
    const timeout = config.timeout_ms || 5000;
    const code: string = config.code || '';

    const logs: string[] = [];

    const sandbox: Record<string, any> = {
      console: {
        log: (...args: any[]) => logs.push(args.map(String).join(' ')),
        error: (...args: any[]) => logs.push('[ERROR] ' + args.map(String).join(' ')),
        warn: (...args: any[]) => logs.push('[WARN] ' + args.map(String).join(' ')),
      },
      JSON,
      Math,
      Date,
      parseInt,
      parseFloat,
      String,
      Number,
      Boolean,
      Array,
      Object,
      input,
      ...input,
    };

    try {
      const context = vm.createContext(sandbox);
      const script = new vm.Script(code);
      const result = script.runInContext(context, { timeout });

      return {
        success: true,
        output: {
          result: result !== undefined ? result : null,
          logs,
        },
        durationMs: Date.now() - start,
      };
    } catch (error: any) {
      return {
        success: false,
        output: { logs },
        error: error.message || 'Code execution failed',
        durationMs: Date.now() - start,
      };
    }
  }
}
