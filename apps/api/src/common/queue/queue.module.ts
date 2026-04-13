import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('redis.host', 'localhost'),
          port: configService.get('redis.port', 6379),
          password: configService.get('redis.password'),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: 'knowledge-processing' },
      { name: 'workflow-execution' },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
