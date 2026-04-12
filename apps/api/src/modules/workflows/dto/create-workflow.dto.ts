import {
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  MaxLength,
  MinLength,
  ValidateNested,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WorkflowNodeType } from '../enums/workflow.enums';

export class CreateWorkflowNodeDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsEnum(WorkflowNodeType)
  type!: WorkflowNodeType;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  position_x?: number;

  @IsOptional()
  @IsNumber()
  position_y?: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @IsOptional()
  @IsObject()
  style?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  sort_order?: number;
}

export class CreateWorkflowEdgeDto {
  @IsString()
  source_node_id!: string;

  @IsString()
  target_node_id!: string;

  @IsOptional()
  @IsString()
  source_handle?: string;

  @IsOptional()
  @IsString()
  target_handle?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsObject()
  condition?: Record<string, any>;

  @IsOptional()
  @IsObject()
  style?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  sort_order?: number;
}

export class CreateWorkflowDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkflowNodeDto)
  nodes?: CreateWorkflowNodeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkflowEdgeDto)
  edges?: CreateWorkflowEdgeDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  trigger_config?: Record<string, any>;

  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;

  @IsOptional()
  @IsObject()
  viewport?: Record<string, any>;
}
