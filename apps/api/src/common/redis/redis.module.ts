import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CacheService } from './cache.service';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const host = configService.get('redis.host', 'localhost');
        const port = configService.get('redis.port', 6379);
        const password = configService.get('redis.password');

        const redis = new Redis({
          host,
          port,
          password,
          lazyConnect: true,
          maxRetriesPerRequest: 3,
          retryStrategy: (times: number) => {
            if (times > 3) return null; // Stop retrying after 3 attempts
            return Math.min(times * 200, 2000);
          },
        });

        redis.on('error', (err) => {
          console.warn('Redis connection error (non-fatal):', err.message);
        });

        // Try to connect but don't fail if Redis is unavailable
        redis.connect().catch(() => {
          console.warn('Redis not available - caching disabled');
        });

        return redis;
      },
      inject: [ConfigService],
    },
    CacheService,
  ],
  exports: [REDIS_CLIENT, CacheService],
})
export class RedisModule {}
