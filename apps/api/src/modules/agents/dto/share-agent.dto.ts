import { IsUUID, IsEnum } from 'class-validator';
import { SharePermission } from '../entities/agent-share.entity';

export class ShareAgentDto {
  @IsUUID()
  sharedWithUserId!: string;

  @IsEnum(SharePermission)
  permission!: SharePermission;
}
