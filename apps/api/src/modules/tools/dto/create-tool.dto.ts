import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ToolType } from '../enums/tool-type.enum';

export class CreateToolDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ToolType)
  type!: ToolType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @IsOptional()
  @IsObject()
  input_schema?: Record<string, any>;

  @IsOptional()
  @IsObject()
  output_schema?: Record<string, any>;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;

  @IsOptional()
  @IsString()
  credentials_ref?: string;

  @IsOptional()
  @IsObject()
  rate_limit?: Record<string, any>;
}
