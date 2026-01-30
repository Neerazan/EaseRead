import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import redisConfig from '../config/redis.config';
import { Document } from '../documents/entities/document.entity';
import { FileContent } from '../documents/entities/file-content.entity';
import { FileCleanupProcessor } from './processors/file-cleanup.processor';
import { CLEANUP_QUEUE, DOCUMENT_PROCESSING_QUEUE } from './queue.constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const redis =
          configService.get<ConfigType<typeof redisConfig>>('redis');
        return {
          connection: {
            host: redis?.host,
            port: redis?.port,
            maxRetriesPerRequest: null,
            enableOfflineQueue: false,
            connectTimeout: 5000,
            retryStrategy: () => null,
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: CLEANUP_QUEUE,
      },
      {
        name: DOCUMENT_PROCESSING_QUEUE,
      },
    ),
    TypeOrmModule.forFeature([Document, FileContent]),
  ],
  providers: [FileCleanupProcessor],
  exports: [BullModule],
})
export class QueueModule {}
