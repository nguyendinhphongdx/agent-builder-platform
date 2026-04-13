import { ToolExecutor, ToolExecutionResult } from './base.executor';

export class EmailExecutor implements ToolExecutor {
  async execute(config: Record<string, any>, input: Record<string, any>): Promise<ToolExecutionResult> {
    const start = Date.now();

    const to: string = input.to || config.default_to || '';
    const subject: string = input.subject || config.default_subject || '';
    const body: string = input.body || '';

    // Log the email that would be sent
    const emailDetails = {
      to,
      subject,
      body,
      from: config.from || 'noreply@agentbuilder.local',
      timestamp: new Date().toISOString(),
    };

    return {
      success: true,
      output: {
        message: 'Email queued (SMTP not configured)',
        email: emailDetails,
      },
      durationMs: Date.now() - start,
    };
  }
}
