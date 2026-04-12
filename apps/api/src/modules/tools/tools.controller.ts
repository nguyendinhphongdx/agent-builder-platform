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
import { ToolsService } from './tools.service';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { TestToolDto } from './dto/test-tool.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('tools')
@UseGuards(JwtAuthGuard)
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Get()
  findAll() {
    return this.toolsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.toolsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateToolDto) {
    return this.toolsService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateToolDto,
  ) {
    return this.toolsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.toolsService.remove(id);
  }

  @Post(':id/test')
  testTool(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TestToolDto,
  ) {
    return this.toolsService.testTool(id, dto);
  }
}
