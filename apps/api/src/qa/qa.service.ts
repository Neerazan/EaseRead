import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentChunk } from '../documents/entities/document-chunk.entity';
import { DocumentsService } from '../documents/documents.service';
import { EmbeddingService } from './embedding.service';

export interface QaResult {
  content: string;
  similarity: number;
  chunkIndex: number;
  pageNumber: number | null;
  chapterTitle: string | null;
  headingPath: string[] | null;
  semanticSummary: string | null;
}

@Injectable()
export class QaService {
  private readonly logger = new Logger(QaService.name);

  constructor(
    @InjectRepository(DocumentChunk)
    private readonly chunkRepository: Repository<DocumentChunk>,
    private readonly documentsService: DocumentsService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  /**
   * Answer a question about a specific document by finding the most
   * semantically similar chunks using pgvector cosine distance.
   */
  async ask(
    documentId: string,
    userId: string,
    question: string,
    topK: number = 5,
  ): Promise<{ question: string; results: QaResult[] }> {
    // 1. Verify document ownership and get the fileContentHash
    const document = await this.documentsService.findOne(documentId, userId);
    const { fileContentHash } = document;

    this.logger.log(
      `Q&A request for document ${documentId} (hash=${fileContentHash}): "${question}"`,
    );

    // 2. Generate embedding for the question
    const questionEmbedding = await this.embeddingService.embedQuery(question);

    // 3. Build the pgvector embedding literal for the SQL query
    const embeddingLiteral = '[' + questionEmbedding.join(',') + ']';

    // 4. Execute cosine similarity search using pgvector's <=> operator
    const results: any[] = await this.chunkRepository.query(
      `
        SELECT
          dc.content,
          dc.index AS "chunkIndex",
          dc."pageNumber",
          dc."chapterTitle",
          dc."headingPath",
          dc."semanticSummary",
          1 - (dc.embedding <=> $1::vector) AS similarity
        FROM document_chunk dc
        WHERE dc."fileContentHash" = $2
          AND dc.embedding IS NOT NULL
        ORDER BY dc.embedding <=> $1::vector ASC
        LIMIT $3
        `,
      [embeddingLiteral, fileContentHash, topK],
    );

    this.logger.log(
      `Found ${results.length} matching chunks for document ${documentId}`,
    );

    return {
      question,
      results: results.map((row) => ({
        content: row.content,
        similarity: parseFloat(String(row.similarity)),
        chunkIndex: row.chunkIndex,
        pageNumber: row.pageNumber ?? null,
        chapterTitle: row.chapterTitle ?? null,
        headingPath: row.headingPath ?? null,
        semanticSummary: row.semanticSummary ?? null,
      })),
    };
  }
}
