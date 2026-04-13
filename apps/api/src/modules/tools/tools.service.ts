import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Tool } from './entities/tool.entity';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { TestToolDto } from './dto/test-tool.dto';
import { RequestContextService } from '../../common/context';
import { ToolExecutorService } from './executors/tool-executor.service';

@Injectable()
export class ToolsService {
  constructor(
    @InjectRepository(Tool)
    private readonly toolRepo: Repository<Tool>,
    private readonly ctx: RequestContextService,
    private readonly toolExecutor: ToolExecutorService,
  ) {}

  async findAll() {
    return this.toolRepo
      .createQueryBuilder('tool')
      .where(
        new Brackets((qb) => {
          qb.where('tool.tenant_id = :tenantId', { tenantId: this.ctx.tenantId }).orWhere(
            'tool.is_builtin = :isBuiltin',
            { isBuiltin: true },
          );
        }),
      )
      .andWhere('tool.is_active = true')
      .orderBy('tool.is_builtin', 'DESC')
      .addOrderBy('tool.name', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<Tool> {
    const tool = await this.toolRepo.findOne({
      where: [
        { id, tenant_id: this.ctx.tenantId },
        { id, is_builtin: true },
      ],
    });
    if (!tool) {
      throw new NotFoundException('Tool not found');
    }
    return tool;
  }

  async create(dto: CreateToolDto): Promise<Tool> {
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const tool = this.toolRepo.create({
      ...dto,
      slug,
      tenant_id: this.ctx.tenantId,
      is_builtin: false,
      creator_id: this.ctx.userId,
      created_by: this.ctx.userId,
      updated_by: this.ctx.userId,
    });

    return this.toolRepo.save(tool);
  }

  async update(
    id: string,
    dto: UpdateToolDto,
  ): Promise<Tool> {
    const tool = await this.findOne(id);
    if (tool.is_builtin) {
      throw new ForbiddenException('Cannot modify builtin tools');
    }

    Object.assign(tool, dto);
    tool.updated_by = this.ctx.userId;
    return this.toolRepo.save(tool);
  }

  async remove(id: string): Promise<void> {
    const tool = await this.findOne(id);
    if (tool.is_builtin) {
      throw new ForbiddenException('Cannot delete builtin tools');
    }
    await this.toolRepo.softRemove(tool);
  }

  async testTool(
    id: string,
    dto: TestToolDto,
  ): Promise<Record<string, any>> {
    const tool = await this.findOne(id);

    const result = await this.toolExecutor.execute(
      tool.type,
      tool.config || {},
      dto.input || {},
    );

    return {
      success: result.success,
      tool: tool.name,
      type: tool.type,
      input: dto.input,
      output: result.output,
      error: result.error,
      durationMs: result.durationMs,
    };
  }
}
