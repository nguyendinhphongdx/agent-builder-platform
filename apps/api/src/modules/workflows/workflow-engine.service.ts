import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { WorkflowExecution } from './entities/workflow-execution.entity';
import { WorkflowExecutionLog } from './entities/workflow-execution-log.entity';
import { Workflow } from './entities/workflow.entity';
import { WorkflowNode } from './entities/workflow-node.entity';
import { WorkflowEdge } from './entities/workflow-edge.entity';
import {
  ExecutionStatus,
  ExecutionLogStatus,
  WorkflowNodeType,
} from './enums/workflow.enums';
import { RequestContextService } from '../../common/context';
import { AgentsService } from '../agents/agents.service';
import { ToolsService } from '../tools/tools.service';
import { ToolExecutorService } from '../tools/executors/tool-executor.service';
import OpenAI from 'openai';
import * as vm from 'vm';

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);

  constructor(
    @InjectRepository(WorkflowExecution)
    private readonly execRepo: Repository<WorkflowExecution>,
    @InjectRepository(WorkflowExecutionLog)
    private readonly logRepo: Repository<WorkflowExecutionLog>,
    private readonly ctx: RequestContextService,
    private readonly configService: ConfigService,
    private readonly agentsService: AgentsService,
    private readonly toolsService: ToolsService,
    private readonly toolExecutorService: ToolExecutorService,
  ) {}

  /**
   * Execute a workflow end-to-end: create execution record, traverse the
   * node graph from the trigger node, run each node, and record results.
   */
  async execute(
    workflow: Workflow,
    input: any,
  ): Promise<WorkflowExecution> {
    const startedAt = new Date();

    // 1. Create execution record
    const execution = this.execRepo.create({
      tenant_id: this.ctx.tenantId,
      workflow_id: workflow.id,
      workflow_version: workflow.version,
      status: ExecutionStatus.RUNNING,
      trigger_type: 'manual',
      input,
      triggered_by: this.ctx.userId,
      started_at: startedAt,
    });
    const saved = await this.execRepo.save(execution);

    try {
      const nodes = workflow.nodes || [];
      const edges = workflow.edges || [];

      // 2. Build adjacency list and node lookup
      const adjacency = this.buildAdjacencyList(edges);
      const nodeMap = new Map<string, WorkflowNode>();
      for (const node of nodes) {
        nodeMap.set(node.id, node);
      }

      // 3. Find trigger node (entry point)
      const triggerNode = nodes.find(
        (n) => n.type === WorkflowNodeType.TRIGGER,
      );
      if (!triggerNode) {
        throw new Error('Workflow has no trigger node');
      }

      // 4. Execute graph depth-first from trigger
      const output = await this.traverseAndExecute(
        triggerNode,
        input,
        saved,
        nodeMap,
        adjacency,
      );

      // 5. Complete execution
      const completedAt = new Date();
      saved.status = ExecutionStatus.COMPLETED;
      saved.output = output;
      saved.duration_ms = completedAt.getTime() - startedAt.getTime();
      saved.completed_at = completedAt;
      return this.execRepo.save(saved);
    } catch (error: any) {
      const completedAt = new Date();
      saved.status = ExecutionStatus.FAILED;
      saved.error = {
        message: error.message,
        stack: error.stack,
      };
      saved.duration_ms = completedAt.getTime() - startedAt.getTime();
      saved.completed_at = completedAt;
      return this.execRepo.save(saved);
    }
  }

  // ───────────────────────── Graph Traversal ─────────────────────────

  private buildAdjacencyList(
    edges: WorkflowEdge[],
  ): Map<string, WorkflowEdge[]> {
    const adj = new Map<string, WorkflowEdge[]>();
    for (const edge of edges) {
      if (!adj.has(edge.source_node_id)) {
        adj.set(edge.source_node_id, []);
      }
      adj.get(edge.source_node_id)!.push(edge);
    }
    return adj;
  }

  /**
   * Depth-first traversal: execute the current node, then follow outgoing
   * edges.  For condition nodes the source_handle decides which branch
   * ('yes' or 'no') to follow.
   */
  private async traverseAndExecute(
    node: WorkflowNode,
    input: any,
    execution: WorkflowExecution,
    nodeMap: Map<string, WorkflowNode>,
    adjacency: Map<string, WorkflowEdge[]>,
  ): Promise<any> {
    // Execute current node and create log
    const result = await this.executeNodeWithLog(node, input, execution);

    // Determine outgoing edges
    const outgoing = adjacency.get(node.id) || [];
    if (outgoing.length === 0) {
      return result;
    }

    // For condition nodes, pick the matching branch
    if (node.type === WorkflowNodeType.CONDITION) {
      const branch =
        result && result.branch === 'yes' ? 'yes' : 'no';
      const matchingEdge = outgoing.find(
        (e) => e.source_handle === branch,
      );
      if (!matchingEdge) {
        return result;
      }
      const nextNode = nodeMap.get(matchingEdge.target_node_id);
      if (!nextNode) {
        return result;
      }
      return this.traverseAndExecute(
        nextNode,
        result,
        execution,
        nodeMap,
        adjacency,
      );
    }

    // For non-condition nodes follow all outgoing edges sequentially
    // (supports linear chains and simple fan-out)
    let lastOutput = result;
    for (const edge of outgoing) {
      const nextNode = nodeMap.get(edge.target_node_id);
      if (!nextNode) continue;
      lastOutput = await this.traverseAndExecute(
        nextNode,
        result,
        execution,
        nodeMap,
        adjacency,
      );
    }
    return lastOutput;
  }

  // ──────────────────── Node Execution w/ Logging ────────────────────

  private async executeNodeWithLog(
    node: WorkflowNode,
    input: any,
    execution: WorkflowExecution,
  ): Promise<any> {
    const log = this.logRepo.create({
      tenant_id: this.ctx.tenantId,
      execution_id: execution.id,
      node_id: node.id,
      status: ExecutionLogStatus.RUNNING,
      input,
      started_at: new Date(),
    });
    const savedLog = await this.logRepo.save(log);

    const start = Date.now();
    try {
      const output = await this.executeNode(node, input);
      const completedAt = new Date();
      savedLog.status = ExecutionLogStatus.COMPLETED;
      savedLog.output = output;
      savedLog.duration_ms = Date.now() - start;
      savedLog.completed_at = completedAt;
      await this.logRepo.save(savedLog);
      return output;
    } catch (error: any) {
      const completedAt = new Date();
      savedLog.status = ExecutionLogStatus.FAILED;
      savedLog.error = error.message;
      savedLog.duration_ms = Date.now() - start;
      savedLog.completed_at = completedAt;
      await this.logRepo.save(savedLog);
      throw error;
    }
  }

  // ───────────────────── Node Type Dispatch ──────────────────────────

  private async executeNode(
    node: WorkflowNode,
    input: any,
  ): Promise<any> {
    switch (node.type) {
      case WorkflowNodeType.TRIGGER:
        return this.executeTrigger(node, input);
      case WorkflowNodeType.AGENT:
        return this.executeAgent(node, input);
      case WorkflowNodeType.CONDITION:
        return this.evaluateCondition(node, input);
      case WorkflowNodeType.ACTION:
        return this.executeAction(node, input);
      case WorkflowNodeType.TRANSFORM:
        return this.executeTransform(node, input);
      case WorkflowNodeType.OUTPUT:
        return this.executeOutput(node, input);
      case WorkflowNodeType.DELAY:
        return this.executeDelay(node, input);
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  // ───────────────────────── Node Handlers ───────────────────────────

  /**
   * Trigger node – entry point. Just passes through the input.
   * Supports trigger types: manual, http, schedule.
   */
  private async executeTrigger(
    node: WorkflowNode,
    input: any,
  ): Promise<any> {
    const config = node.config || {};
    const triggerType = config.trigger_type || 'manual';

    switch (triggerType) {
      case 'http':
        // Extract relevant fields from an HTTP request payload
        return {
          method: input?.method || 'POST',
          headers: input?.headers || {},
          body: input?.body || input,
          query: input?.query || {},
        };
      case 'schedule':
        return {
          scheduled: true,
          cron: config.cron || '* * * * *',
          triggered_at: new Date().toISOString(),
          data: input,
        };
      case 'manual':
      default:
        return input;
    }
  }

  /**
   * Agent node – calls an LLM via OpenAI SDK pointing at LiteLLM proxy.
   */
  private async executeAgent(
    node: WorkflowNode,
    input: any,
  ): Promise<any> {
    const config = node.config || {};
    const agentId: string | undefined = config.agent_id;

    let systemPrompt = config.system_prompt || '';
    let model = config.model || 'gpt-3.5-turbo';

    // If agent_id is provided, load agent settings from DB
    if (agentId) {
      try {
        const agent = await this.agentsService.findOne(agentId);
        systemPrompt = agent.instructions || systemPrompt;
        model =
          agent.model_config?.model || model;
      } catch {
        this.logger.warn(
          `Agent ${agentId} not found, using node config`,
        );
      }
    }

    // Build messages
    const messages: OpenAI.ChatCompletionMessageParam[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    const userContent =
      typeof input === 'string'
        ? input
        : JSON.stringify(input, null, 2);
    messages.push({ role: 'user', content: userContent });

    // Call LLM via LiteLLM proxy (OpenAI-compatible)
    const litellmUrl =
      this.configService.get<string>('LITELLM_URL') ||
      'http://localhost:4000';
    const litellmKey =
      this.configService.get<string>('LITELLM_KEY') || '';

    const openai = new OpenAI({
      baseURL: `${litellmUrl}/v1`,
      apiKey: litellmKey,
    });

    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: config.temperature ?? 0.7,
      max_tokens: config.max_tokens ?? 2048,
    });

    const choice = completion.choices?.[0];
    return {
      content: choice?.message?.content || '',
      model: completion.model,
      usage: completion.usage,
    };
  }

  /**
   * Condition node – evaluates rules against input data.
   * Config shape: { rules: [{ field, operator, value }], logic: 'and' | 'or' }
   */
  private async evaluateCondition(
    node: WorkflowNode,
    input: any,
  ): Promise<{ result: boolean; branch: 'yes' | 'no'; input: any }> {
    const config = node.config || {};
    const rules: Array<{
      field: string;
      operator: string;
      value: any;
    }> = config.rules || [];
    const logic: string = config.logic || 'and';

    if (rules.length === 0) {
      return { result: true, branch: 'yes', input };
    }

    const results = rules.map((rule) => {
      const fieldValue = this.getNestedValue(input, rule.field);
      return this.evaluateRule(fieldValue, rule.operator, rule.value);
    });

    const passed =
      logic === 'or'
        ? results.some(Boolean)
        : results.every(Boolean);

    return {
      result: passed,
      branch: passed ? 'yes' : 'no',
      input,
    };
  }

  /**
   * Action node – executes a tool via ToolExecutorService.
   */
  private async executeAction(
    node: WorkflowNode,
    input: any,
  ): Promise<any> {
    const config = node.config || {};
    const toolId: string | undefined = config.tool_id;

    if (!toolId) {
      throw new Error('Action node requires a tool_id in config');
    }

    const tool = await this.toolsService.findOne(toolId);
    const toolConfig = { ...tool.config, ...config.tool_config };
    const toolInput = config.input_mapping
      ? this.mapInput(input, config.input_mapping)
      : input;

    const result = await this.toolExecutorService.execute(
      tool.type,
      toolConfig,
      toolInput,
    );

    if (!result.success) {
      throw new Error(
        `Tool execution failed: ${result.error || 'Unknown error'}`,
      );
    }

    return result.output;
  }

  /**
   * Transform node – runs a JavaScript snippet in a sandboxed VM context.
   * The input is available as the `data` variable.
   */
  private async executeTransform(
    node: WorkflowNode,
    input: any,
  ): Promise<any> {
    const config = node.config || {};
    const code: string = config.code || 'return data;';

    const sandbox = {
      data: input,
      result: undefined as any,
      JSON,
      Math,
      Date,
      Array,
      Object,
      String,
      Number,
      Boolean,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
    };

    const wrappedCode = `result = (function() { ${code} })();`;

    const context = vm.createContext(sandbox);
    vm.runInContext(wrappedCode, context, {
      timeout: 5000, // 5 second timeout for transforms
    });

    return sandbox.result;
  }

  /**
   * Output node – formats and returns the final result.
   */
  private async executeOutput(
    node: WorkflowNode,
    input: any,
  ): Promise<any> {
    const config = node.config || {};
    const format = config.format || 'raw';

    switch (format) {
      case 'template': {
        const template: string = config.template || '{{data}}';
        return {
          formatted: this.renderTemplate(template, input),
        };
      }
      case 'json':
        return { formatted: JSON.stringify(input, null, 2) };
      case 'text':
        return {
          formatted:
            typeof input === 'string' ? input : JSON.stringify(input),
        };
      case 'raw':
      default:
        return input;
    }
  }

  /**
   * Delay node – waits for a configured duration then passes input through.
   */
  private async executeDelay(
    node: WorkflowNode,
    input: any,
  ): Promise<any> {
    const config = node.config || {};
    const durationMs = config.duration_ms || 1000;
    const capped = Math.min(durationMs, 30000); // cap at 30 seconds

    await new Promise((resolve) => setTimeout(resolve, capped));
    return input;
  }

  // ─────────────────────── Helper Methods ────────────────────────────

  /**
   * Get a nested value from an object using dot-notation path.
   * e.g. getNestedValue({ a: { b: 1 } }, 'a.b') => 1
   */
  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((current, key) => {
      return current != null ? current[key] : undefined;
    }, obj);
  }

  /**
   * Evaluate a single condition rule.
   */
  private evaluateRule(
    fieldValue: any,
    operator: string,
    ruleValue: any,
  ): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue == ruleValue; // eslint-disable-line eqeqeq
      case 'not_equals':
        return fieldValue != ruleValue; // eslint-disable-line eqeqeq
      case 'contains':
        return (
          typeof fieldValue === 'string' &&
          fieldValue.includes(String(ruleValue))
        );
      case 'not_contains':
        return (
          typeof fieldValue === 'string' &&
          !fieldValue.includes(String(ruleValue))
        );
      case 'greater_than':
        return Number(fieldValue) > Number(ruleValue);
      case 'less_than':
        return Number(fieldValue) < Number(ruleValue);
      case 'is_empty':
        return (
          fieldValue === null ||
          fieldValue === undefined ||
          fieldValue === '' ||
          (Array.isArray(fieldValue) && fieldValue.length === 0)
        );
      case 'is_not_empty':
        return (
          fieldValue !== null &&
          fieldValue !== undefined &&
          fieldValue !== '' &&
          !(Array.isArray(fieldValue) && fieldValue.length === 0)
        );
      default:
        this.logger.warn(`Unknown operator: ${operator}`);
        return false;
    }
  }

  /**
   * Map input fields using a mapping config.
   * mapping: { targetKey: 'source.path' }
   */
  private mapInput(
    input: any,
    mapping: Record<string, string>,
  ): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [target, sourcePath] of Object.entries(mapping)) {
      result[target] = this.getNestedValue(input, sourcePath);
    }
    return result;
  }

  /**
   * Simple template renderer – replaces {{path}} with values from data.
   */
  private renderTemplate(template: string, data: any): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (_match, path: string) => {
      const value = this.getNestedValue(data, path.trim());
      return value !== undefined ? String(value) : '';
    });
  }
}
