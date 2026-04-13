import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Workflow } from './entities/workflow.entity';
import { WorkflowNode } from './entities/workflow-node.entity';
import { WorkflowEdge } from './entities/workflow-edge.entity';
import { WorkflowExecution } from './entities/workflow-execution.entity';
import { WorkflowExecutionLog } from './entities/workflow-execution-log.entity';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { ExecuteWorkflowDto } from './dto/execute-workflow.dto';
import { RequestContextService } from '../../common/context';
import { WorkflowEngineService } from './workflow-engine.service';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepo: Repository<Workflow>,
    @InjectRepository(WorkflowNode)
    private readonly nodeRepo: Repository<WorkflowNode>,
    @InjectRepository(WorkflowEdge)
    private readonly edgeRepo: Repository<WorkflowEdge>,
    @InjectRepository(WorkflowExecution)
    private readonly executionRepo: Repository<WorkflowExecution>,
    @InjectRepository(WorkflowExecutionLog)
    private readonly logRepo: Repository<WorkflowExecutionLog>,
    private readonly dataSource: DataSource,
    private readonly ctx: RequestContextService,
    private readonly workflowEngine: WorkflowEngineService,
  ) {}

  async findAll() {
    return this.workflowRepo.find({
      where: { tenant_id: this.ctx.tenantId },
      order: { updated_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Workflow> {
    const workflow = await this.workflowRepo.findOne({
      where: { id, tenant_id: this.ctx.tenantId },
      relations: ['nodes', 'edges'],
    });
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }
    return workflow;
  }

  async create(
    dto: CreateWorkflowDto,
  ): Promise<Workflow> {
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36);

    return this.dataSource.transaction(async (manager) => {
      const workflow = manager.create(Workflow, {
        tenant_id: this.ctx.tenantId,
        name: dto.name,
        slug,
        description: dto.description,
        tags: dto.tags,
        trigger_config: dto.trigger_config,
        variables: dto.variables,
        viewport: dto.viewport,
        creator_id: this.ctx.userId,
        created_by: this.ctx.userId,
        updated_by: this.ctx.userId,
      });
      const saved = await manager.save(workflow);

      if (dto.nodes?.length) {
        const nodes = dto.nodes.map((n) =>
          manager.create(WorkflowNode, {
            ...n,
            tenant_id: this.ctx.tenantId,
            workflow_id: saved.id,
          }),
        );
        await manager.save(nodes);
      }

      if (dto.edges?.length) {
        const edges = dto.edges.map((e) =>
          manager.create(WorkflowEdge, {
            ...e,
            tenant_id: this.ctx.tenantId,
            workflow_id: saved.id,
          }),
        );
        await manager.save(edges);
      }

      return this.findOne(saved.id);
    });
  }

  async update(
    id: string,
    dto: UpdateWorkflowDto,
  ): Promise<Workflow> {
    const workflow = await this.findOne(id);

    return this.dataSource.transaction(async (manager) => {
      // Update workflow fields
      if (dto.name !== undefined) workflow.name = dto.name;
      if (dto.description !== undefined) workflow.description = dto.description;
      if (dto.status !== undefined) workflow.status = dto.status;
      if (dto.tags !== undefined) workflow.tags = dto.tags;
      if (dto.trigger_config !== undefined) workflow.trigger_config = dto.trigger_config;
      if (dto.variables !== undefined) workflow.variables = dto.variables;
      if (dto.viewport !== undefined) workflow.viewport = dto.viewport;
      workflow.version = workflow.version + 1;
      workflow.updated_by = this.ctx.userId;
      await manager.save(workflow);

      // Replace nodes if provided
      if (dto.nodes !== undefined) {
        await manager.delete(WorkflowNode, { workflow_id: id });
        if (dto.nodes.length) {
          const nodes = dto.nodes.map((n) =>
            manager.create(WorkflowNode, {
              ...n,
              tenant_id: this.ctx.tenantId,
              workflow_id: id,
            }),
          );
          await manager.save(nodes);
        }
      }

      // Replace edges if provided
      if (dto.edges !== undefined) {
        await manager.delete(WorkflowEdge, { workflow_id: id });
        if (dto.edges.length) {
          const edges = dto.edges.map((e) =>
            manager.create(WorkflowEdge, {
              ...e,
              tenant_id: this.ctx.tenantId,
              workflow_id: id,
            }),
          );
          await manager.save(edges);
        }
      }

      return this.findOne(id);
    });
  }

  async softDelete(id: string): Promise<void> {
    const workflow = await this.findOne(id);
    await this.workflowRepo.softRemove(workflow);
  }

  async execute(
    id: string,
    dto: ExecuteWorkflowDto,
  ): Promise<WorkflowExecution> {
    const workflow = await this.findOne(id);
    return this.workflowEngine.execute(workflow, dto.input);
  }

  async getExecutions(workflowId: string) {
    return this.executionRepo.find({
      where: { tenant_id: this.ctx.tenantId, workflow_id: workflowId },
      order: { created_at: 'DESC' },
    });
  }

  async getExecutionDetail(executionId: string) {
    const execution = await this.executionRepo.findOne({
      where: { id: executionId, tenant_id: this.ctx.tenantId },
    });
    if (!execution) {
      throw new NotFoundException('Execution not found');
    }

    const logs = await this.logRepo.find({
      where: { execution_id: executionId },
      order: { created_at: 'ASC' },
    });

    return { ...execution, logs };
  }
}
