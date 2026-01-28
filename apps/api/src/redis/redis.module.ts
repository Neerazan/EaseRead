import { Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import { Redis } from 'ioredis';
import redisConfig from '../config/redis.config';
import { REDIS_CLIENT } from './redis.constants';

@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const redis =
          configService.get<ConfigType<typeof redisConfig>>('redis');

        return new Redis({
          host: redis?.host,
          port: redis?.port,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {}

  onApplicationShutdown() {
    return this.redisClient.quit();
  }
}
