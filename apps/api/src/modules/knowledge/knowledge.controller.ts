import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { KnowledgeService } from './knowledge.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('agents/:agentId/knowledge')
@UseGuards(JwtAuthGuard)
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 10))
  upload(
    @Param('agentId', ParseUUIDPipe) agentId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.knowledgeService.upload(agentId, files);
  }

  @Get()
  findAll(@Param('agentId', ParseUUIDPipe) agentId: string) {
    return this.knowledgeService.findAll(agentId);
  }

  @Delete(':fileId')
  remove(
    @Param('agentId', ParseUUIDPipe) agentId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ) {
    return this.knowledgeService.remove(agentId, fileId);
  }
}
