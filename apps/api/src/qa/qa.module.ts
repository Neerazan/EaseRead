import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import geminiConfig from '../config/gemini.config';
import { DocumentChunk } from '../documents/entities/document-chunk.entity';
import { DocumentsModule } from '../documents/documents.module';
import { EmbeddingService } from './embedding.service';
import { QaController } from './qa.controller';
import { QaService } from './qa.service';

@Module({
  imports: [
    ConfigModule.forFeature(geminiConfig),
    TypeOrmModule.forFeature([DocumentChunk]),
    DocumentsModule,
  ],
  controllers: [QaController],
  providers: [EmbeddingService, QaService],
})
export class QaModule {}
