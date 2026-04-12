import { IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class CreateSessionDto {
  @IsUUID()
  agentId!: string;

  @IsOptional()
  @IsBoolean()
  isPreview?: boolean;
}
