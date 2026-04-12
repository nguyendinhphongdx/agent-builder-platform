import { IsOptional, IsString, IsEnum, IsArray, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AgentStatus } from '../enums/agent-status.enum';
import { AgentVisibility } from '../enums/agent-visibility.enum';
import { AgentMode } from '../enums/agent-mode.enum';

export class QueryAgentDto extends PaginationDto {
  @IsOptional()
  @IsEnum(AgentStatus)
  status?: AgentStatus;

  @IsOptional()
  @IsEnum(AgentVisibility)
  visibility?: AgentVisibility;

  @IsOptional()
  @IsEnum(AgentMode)
  mode?: AgentMode;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsUUID()
  creatorId?: string;
}
