import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolsController } from './tools.controller';
import { ToolsService } from './tools.service';
import { Tool } from './entities/tool.entity';
import { ToolCredential } from './entities/tool-credential.entity';
import { ToolExecutorService } from './executors/tool-executor.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tool, ToolCredential])],
  controllers: [ToolsController],
  providers: [ToolsService, ToolExecutorService],
  exports: [ToolsService, ToolExecutorService],
})
export class ToolsModule {}
