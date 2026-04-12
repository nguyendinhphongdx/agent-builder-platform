import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { QueryAgentDto } from './dto/query-agent.dto';
import { ShareAgentDto } from './dto/share-agent.dto';
import { AddCollaboratorDto } from './dto/add-collaborator.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  findAll(@Query() query: QueryAgentDto) {
    return this.agentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.agentsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateAgentDto) {
    return this.agentsService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAgentDto) {
    return this.agentsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.agentsService.softDelete(id);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id', ParseUUIDPipe) id: string) {
    return this.agentsService.duplicate(id);
  }

  @Post(':id/share')
  share(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ShareAgentDto) {
    return this.agentsService.share(id, dto);
  }

  @Get(':id/collaborators')
  getCollaborators(@Param('id', ParseUUIDPipe) id: string) {
    return this.agentsService.getCollaborators(id);
  }

  @Post(':id/collaborators')
  addCollaborator(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddCollaboratorDto,
  ) {
    return this.agentsService.addCollaborator(id, dto);
  }

  @Delete(':id/collaborators/:collabId')
  removeCollaborator(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('collabId', ParseUUIDPipe) collabId: string,
  ) {
    return this.agentsService.removeCollaborator(id, collabId);
  }
}
