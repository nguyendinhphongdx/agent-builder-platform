import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantLlmKey } from './entities/tenant-llm-key.entity';
import { CreateLlmKeyDto } from './dto/create-llm-key.dto';
import { UpdateLlmKeyDto } from './dto/update-llm-key.dto';
import { RequestContextService } from '../../common/context';

@Injectable()
export class TenantLlmKeysService {
  constructor(
    @InjectRepository(TenantLlmKey)
    private readonly llmKeyRepo: Repository<TenantLlmKey>,
    private readonly ctx: RequestContextService,
  ) {}

  async findAll(): Promise<TenantLlmKey[]> {
    const keys = await this.llmKeyRepo.find({
      where: { tenant_id: this.ctx.tenantId },
      order: { created_at: 'DESC' },
    });

    // Hide full encrypted key, show only prefix
    return keys.map((key) => {
      const decrypted = this.decryptKey(key.api_key_encrypted);
      const prefix = decrypted.substring(0, 8) + '...' + decrypted.substring(decrypted.length - 4);
      (key as any).key_prefix = prefix;
      key.api_key_encrypted = '***';
      return key;
    });
  }

  async create(dto: CreateLlmKeyDto): Promise<TenantLlmKey> {
    // If this key is set as default, unset other defaults for same provider
    if (dto.isDefault) {
      await this.llmKeyRepo.update(
        { tenant_id: this.ctx.tenantId, provider: dto.provider, is_default: true },
        { is_default: false },
      );
    }

    const key = this.llmKeyRepo.create({
      tenant_id: this.ctx.tenantId,
      provider: dto.provider,
      display_name: dto.displayName || `${dto.provider} Key`,
      api_key_encrypted: this.encryptKey(dto.apiKey),
      base_url: dto.baseUrl,
      org_id: dto.orgId,
      is_default: dto.isDefault ?? false,
      models_available: dto.modelsAvailable,
      created_by: this.ctx.userId,
    });

    return this.llmKeyRepo.save(key);
  }

  async update(id: string, dto: UpdateLlmKeyDto): Promise<TenantLlmKey> {
    const key = await this.llmKeyRepo.findOne({
      where: { id, tenant_id: this.ctx.tenantId },
    });
    if (!key) {
      throw new NotFoundException('LLM key not found');
    }

    // If setting as default, unset other defaults for same provider
    if (dto.isDefault) {
      await this.llmKeyRepo.update(
        { tenant_id: this.ctx.tenantId, provider: key.provider, is_default: true },
        { is_default: false },
      );
    }

    if (dto.displayName !== undefined) key.display_name = dto.displayName;
    if (dto.apiKey !== undefined) key.api_key_encrypted = this.encryptKey(dto.apiKey);
    if (dto.baseUrl !== undefined) key.base_url = dto.baseUrl;
    if (dto.orgId !== undefined) key.org_id = dto.orgId;
    if (dto.isDefault !== undefined) key.is_default = dto.isDefault;
    if (dto.modelsAvailable !== undefined) key.models_available = dto.modelsAvailable;

    return this.llmKeyRepo.save(key);
  }

  async remove(id: string): Promise<void> {
    const key = await this.llmKeyRepo.findOne({
      where: { id, tenant_id: this.ctx.tenantId },
    });
    if (!key) {
      throw new NotFoundException('LLM key not found');
    }
    await this.llmKeyRepo.softRemove(key);
  }

  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const key = await this.llmKeyRepo.findOne({
      where: { id, tenant_id: this.ctx.tenantId },
    });
    if (!key) {
      throw new NotFoundException('LLM key not found');
    }

    const apiKey = this.decryptKey(key.api_key_encrypted);
    const baseUrl = key.base_url || this.getProviderBaseUrl(key.provider);

    try {
      // Try listing models as a connectivity test
      const OpenAI = (await import('openai')).default;
      const client = new OpenAI({ baseURL: baseUrl, apiKey });
      await client.models.list();

      // Update key status
      key.is_active = true;
      await this.llmKeyRepo.save(key);

      return { success: true, message: 'Connection successful' };
    } catch (error: any) {
      key.is_active = false;
      await this.llmKeyRepo.save(key);

      return {
        success: false,
        message: error.message || 'Connection failed',
      };
    }
  }

  async findByProvider(provider: string): Promise<TenantLlmKey | null> {
    return this.llmKeyRepo.findOne({
      where: {
        tenant_id: this.ctx.tenantId,
        provider,
        is_active: true,
        is_default: true,
      },
    });
  }

  // TODO: Replace with AES-256 encryption
  encryptKey(plainKey: string): string {
    return Buffer.from(plainKey).toString('base64');
  }

  decryptKey(encryptedKey: string): string {
    return Buffer.from(encryptedKey, 'base64').toString('utf-8');
  }

  private getProviderBaseUrl(provider: string): string {
    const urls: Record<string, string> = {
      openai: 'https://api.openai.com/v1',
      anthropic: 'https://api.anthropic.com/v1',
      google: 'https://generativelanguage.googleapis.com/v1beta',
      azure: 'https://api.openai.com/v1',
    };
    return urls[provider] || 'https://api.openai.com/v1';
  }
}
