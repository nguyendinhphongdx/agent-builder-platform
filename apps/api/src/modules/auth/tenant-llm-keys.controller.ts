import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TenantLlmKeysService } from './tenant-llm-keys.service';
import { CreateLlmKeyDto } from './dto/create-llm-key.dto';
import { UpdateLlmKeyDto } from './dto/update-llm-key.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('tenants/llm-keys')
@UseGuards(JwtAuthGuard)
export class TenantLlmKeysController {
  constructor(private readonly tenantLlmKeysService: TenantLlmKeysService) {}

  @Get()
  findAll() {
    return this.tenantLlmKeysService.findAll();
  }

  @Post()
  create(@Body() dto: CreateLlmKeyDto) {
    return this.tenantLlmKeysService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLlmKeyDto,
  ) {
    return this.tenantLlmKeysService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantLlmKeysService.remove(id);
  }

  @Post(':id/test')
  testConnection(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantLlmKeysService.testConnection(id);
  }
}
