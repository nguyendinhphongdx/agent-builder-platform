import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('sessions')
  createSession(@Body() dto: CreateSessionDto) {
    return this.chatService.createSession(dto);
  }

  @Get('sessions/:sessionId/messages')
  getMessages(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.chatService.getMessages(
      sessionId,
      page ? +page : 1,
      limit ? +limit : 50,
    );
  }

  @Post('sessions/:sessionId/messages')
  async sendMessage(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: SendMessageDto,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      // Save user message
      await this.chatService.saveUserMessage(sessionId, dto.content);

      // Load session with agent
      const session = await this.chatService.getSession(sessionId);
      const agent = session.agent!;

      // Load conversation history
      const history = await this.chatService.getConversationHistory(sessionId);
      const messages = history.reverse().map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Stream response via LLM (falls back to mock on error)
      let fullResponse = '';
      const stream = this.chatService.streamResponse(messages, agent);

      for await (const event of stream) {
        if (event.type === 'token') {
          const delta = (event.data as Record<string, string>).delta;
          fullResponse += delta;
          res.write(`event: token\ndata: ${JSON.stringify({ delta })}\n\n`);
        } else if (event.type === 'done') {
          // Save assistant message
          const tokenCount = fullResponse.split(' ').length * 2; // rough estimate
          await this.chatService.saveAssistantMessage(
            sessionId,
            fullResponse.trim(),
            { tokens: tokenCount },
          );

          // Update session stats
          await this.chatService.updateSessionStats(sessionId, tokenCount);

          // Send done event
          res.write(
            `event: done\ndata: ${JSON.stringify({ usage: { total_tokens: tokenCount } })}\n\n`,
          );
        } else if (event.type === 'tool_call') {
          res.write(
            `event: tool_call\ndata: ${JSON.stringify(event.data)}\n\n`,
          );
        } else if (event.type === 'error') {
          res.write(
            `event: error\ndata: ${JSON.stringify(event.data)}\n\n`,
          );
        }
      }

      res.end();
    } catch (error: any) {
      res.write(
        `event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`,
      );
      res.end();
    }
  }

  @Delete('sessions/:sessionId')
  deleteSession(@Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.chatService.deleteSession(sessionId);
  }
}
