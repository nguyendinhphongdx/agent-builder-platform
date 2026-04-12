import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Agent } from './entities/agent.entity';
import { AgentVersion } from './entities/agent-version.entity';
import { AgentShare } from './entities/agent-share.entity';
import { AgentCollaborator } from './entities/agent-collaborator.entity';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { QueryAgentDto } from './dto/query-agent.dto';
import { ShareAgentDto } from './dto/share-agent.dto';
import { AddCollaboratorDto } from './dto/add-collaborator.dto';
import { RequestContextService } from '../../common/context';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepo: Repository<Agent>,
    @InjectRepository(AgentVersion)
    private readonly versionRepo: Repository<AgentVersion>,
    @InjectRepository(AgentShare)
    private readonly shareRepo: Repository<AgentShare>,
    @InjectRepository(AgentCollaborator)
    private readonly collaboratorRepo: Repository<AgentCollaborator>,
    private readonly dataSource: DataSource,
    private readonly ctx: RequestContextService,
  ) {}

  async findAll(query: QueryAgentDto) {
    const qb = this.agentRepo.createQueryBuilder('agent');
    qb.where('agent.tenant_id = :tenantId', {
      tenantId: this.ctx.tenantId,
    });

    if (query.status) {
      qb.andWhere('agent.status = :status', { status: query.status });
    }
    if (query.visibility) {
      qb.andWhere('agent.visibility = :visibility', {
        visibility: query.visibility,
      });
    }
    if (query.mode) {
      qb.andWhere('agent.mode = :mode', { mode: query.mode });
    }
    if (query.search) {
      qb.andWhere(
        '(agent.name ILIKE :search OR agent.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }
    if (query.tags && query.tags.length > 0) {
      qb.andWhere('agent.tags && :tags', { tags: query.tags });
    }
    if (query.creatorId) {
      qb.andWhere('agent.creator_id = :creatorId', {
        creatorId: query.creatorId,
      });
    }

    const sortBy = query.sortBy || 'created_at';
    const sortOrder = query.sortOrder || 'DESC';
    qb.orderBy(`agent.${sortBy}`, sortOrder);

    const page = query.page || 1;
    const limit = query.limit || 20;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Agent> {
    const agent = await this.agentRepo.findOne({
      where: { id, tenant_id: this.ctx.tenantId },
      relations: [
        'knowledge',
        'tools',
        'tools.tool',
        'collaborators',
        'collaborators.child_agent',
        'creator',
      ],
    });
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }
    return agent;
  }

  async create(dto: CreateAgentDto): Promise<Agent> {
    const slug = this.generateSlug(dto.name);

    const existing = await this.agentRepo.findOne({
      where: { tenant_id: this.ctx.tenantId, slug },
    });
    if (existing) {
      throw new ConflictException('An agent with this name already exists');
    }

    const agent = this.agentRepo.create({
      ...dto,
      tenant_id: this.ctx.tenantId,
      slug,
      creator_id: this.ctx.userId,
      created_by: this.ctx.userId,
      updated_by: this.ctx.userId,
    });

    return this.agentRepo.save(agent);
  }

  async update(id: string, dto: UpdateAgentDto): Promise<Agent> {
    const agent = await this.findOne(id);

    return this.dataSource.transaction(async (manager) => {
      // Save version snapshot before update
      const versionSnapshot = { ...agent };
      delete (versionSnapshot as any).knowledge;
      delete (versionSnapshot as any).tools;
      delete (versionSnapshot as any).collaborators;
      delete (versionSnapshot as any).creator;

      const version = manager.create(AgentVersion, {
        tenant_id: this.ctx.tenantId,
        agent_id: id,
        version: agent.version,
        snapshot: versionSnapshot,
        created_by: this.ctx.userId,
      });
      await manager.save(version);

      // Update agent
      Object.assign(agent, dto);
      agent.version = agent.version + 1;
      agent.updated_by = this.ctx.userId;

      return manager.save(agent);
    });
  }

  async softDelete(id: string): Promise<void> {
    const agent = await this.findOne(id);
    await this.agentRepo.softRemove(agent);
  }

  async duplicate(id: string): Promise<Agent> {
    const source = await this.findOne(id);

    const newName = `${source.name} (Copy)`;
    const slug = this.generateSlug(newName);

    const duplicate = this.agentRepo.create({
      tenant_id: this.ctx.tenantId,
      name: newName,
      slug,
      description: source.description,
      instructions: source.instructions,
      icon: source.icon,
      mode: source.mode,
      visibility: source.visibility,
      model_config: source.model_config,
      welcome_message: source.welcome_message,
      tags: source.tags,
      metadata: source.metadata,
      creator_id: this.ctx.userId,
      created_by: this.ctx.userId,
      updated_by: this.ctx.userId,
    });

    return this.agentRepo.save(duplicate);
  }

  async share(agentId: string, dto: ShareAgentDto): Promise<AgentShare> {
    await this.findOne(agentId);

    const share = this.shareRepo.create({
      tenant_id: this.ctx.tenantId,
      agent_id: agentId,
      shared_with_user_id: dto.sharedWithUserId,
      permission: dto.permission,
      shared_by: this.ctx.userId,
    });

    return this.shareRepo.save(share);
  }

  async getCollaborators(agentId: string): Promise<AgentCollaborator[]> {
    return this.collaboratorRepo.find({
      where: {
        tenant_id: this.ctx.tenantId,
        parent_agent_id: agentId,
      },
      relations: ['child_agent'],
      order: { sort_order: 'ASC' },
    });
  }

  async addCollaborator(
    agentId: string,
    dto: AddCollaboratorDto,
  ): Promise<AgentCollaborator> {
    await this.findOne(agentId);

    const collaborator = this.collaboratorRepo.create({
      tenant_id: this.ctx.tenantId,
      parent_agent_id: agentId,
      child_agent_id: dto.childAgentId,
      role: dto.role,
      description: dto.description,
      delegation_rules: dto.delegationRules,
      sort_order: dto.sortOrder ?? 0,
      is_active: dto.isActive ?? true,
      created_by: this.ctx.userId,
    });

    return this.collaboratorRepo.save(collaborator);
  }

  async removeCollaborator(
    agentId: string,
    collaboratorId: string,
  ): Promise<void> {
    const collab = await this.collaboratorRepo.findOne({
      where: {
        id: collaboratorId,
        tenant_id: this.ctx.tenantId,
        parent_agent_id: agentId,
      },
    });
    if (!collab) {
      throw new NotFoundException('Collaborator not found');
    }
    await this.collaboratorRepo.softRemove(collab);
  }

  private generateSlug(name: string): string {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 200) +
      '-' +
      Date.now().toString(36)
    );
  }
}
