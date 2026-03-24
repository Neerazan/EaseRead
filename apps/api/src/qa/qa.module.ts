import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import geminiConfig from '../config/gemini.config';
import { DocumentChunk } from '../documents/entities/document-chunk.entity';
import { DocumentsModule } from '../documents/documents.module';
import { RedisModule } from '../redis/redis.module';
import { ChatMessage } from './entities/chat-message.entity';
import { EmbeddingService } from './embedding.service';
import { QaController } from './qa.controller';
import { QaService } from './qa.service';
import { DictionaryController } from './dictionary.controller';
import { DictionaryService } from './dictionary.service';
import { LlmService } from './llm.service';
import { RagSearchService } from './rag-search.service';

@Module({
  imports: [
    ConfigModule.forFeature(geminiConfig),
    TypeOrmModule.forFeature([DocumentChunk, ChatMessage]),
    DocumentsModule,
    RedisModule, // Imported to provide REDIS_CLIENT for DictionaryService
  ],
  controllers: [QaController, DictionaryController],
  providers: [
    EmbeddingService,
    QaService,
    DictionaryService,
    LlmService,
    RagSearchService,
  ],
})
export class QaModule {}
