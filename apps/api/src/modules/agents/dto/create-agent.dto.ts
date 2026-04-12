import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsArray,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AgentMode } from '../enums/agent-mode.enum';
import { AgentVisibility } from '../enums/agent-visibility.enum';

export class CreateAgentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;

  @IsOptional()
  @IsEnum(AgentMode)
  mode?: AgentMode;

  @IsOptional()
  @IsEnum(AgentVisibility)
  visibility?: AgentVisibility;

  @IsOptional()
  @IsObject()
  model_config?: Record<string, any>;

  @IsOptional()
  @IsString()
  welcome_message?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
