import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { Agent } from './entities/agent.entity';
import { AgentKnowledge } from './entities/agent-knowledge.entity';
import { AgentTool } from './entities/agent-tool.entity';
import { AgentCollaborator } from './entities/agent-collaborator.entity';
import { AgentShare } from './entities/agent-share.entity';
import { AgentVersion } from './entities/agent-version.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Agent,
      AgentKnowledge,
      AgentTool,
      AgentCollaborator,
      AgentShare,
      AgentVersion,
    ]),
  ],
  controllers: [AgentsController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
