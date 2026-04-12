import { IsUUID, IsOptional, IsString, IsObject, IsInt, IsBoolean } from 'class-validator';

export class AddCollaboratorDto {
  @IsUUID()
  childAgentId!: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  delegationRules?: Record<string, any>;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
