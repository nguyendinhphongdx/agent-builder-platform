import { PartialType } from '@nestjs/mapped-types';
import { CreateAgentDto } from './create-agent.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { AgentStatus } from '../enums/agent-status.enum';

export class UpdateAgentDto extends PartialType(CreateAgentDto) {
  @IsOptional()
  @IsEnum(AgentStatus)
  status?: AgentStatus;
}
