import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentChunk } from '../documents/entities/document-chunk.entity';
import { EmbeddingService } from './embedding.service';

export interface RagSearchResult {
  content: string;
  similarity: number;
  chapterTitle: string | null;
  pageNumber: number | null;
}

@Injectable()
export class RagSearchService {
  private readonly logger = new Logger(RagSearchService.name);

  constructor(
    @InjectRepository(DocumentChunk)
    private readonly chunkRepository: Repository<DocumentChunk>,
    private readonly embeddingService: EmbeddingService,
  ) {}

  /**
   * Search for relevant document chunks using pgvector cosine similarity.
   * Can conditionally filter out spoilers based on maxPageRead.
   */
  async search(
    query: string,
    fileContentHash: string,
    preventSpoilers: boolean,
    maxPageRead?: number,
    topK: number = 5,
  ): Promise<RagSearchResult[]> {
    this.logger.log(
      `Executing RAG search for query: "${query}" (Hash: ${fileContentHash})`,
    );

    const queryEmbedding = await this.embeddingService.embedQuery(query);
    const embeddingLiteral = '[' + queryEmbedding.join(',') + ']';

    let sqlQuery = `
      SELECT
        dc.content,
        dc."pageNumber",
        dc."chapterTitle",
        1 - (dc.embedding <=> $1::vector) AS similarity
      FROM document_chunk dc
      WHERE dc."fileContentHash" = $2
        AND dc.embedding IS NOT NULL
    `;
    const params: any[] = [embeddingLiteral, fileContentHash];

    // Apply spoiler prevention filter!
    if (preventSpoilers && maxPageRead && maxPageRead > 0) {
      sqlQuery += ` AND dc."pageNumber" <= $3`;
      params.push(maxPageRead);
      this.logger.log(`Spoiler prevention enabled up to page ${maxPageRead}`);
    }

    sqlQuery += ` ORDER BY dc.embedding <=> $1::vector ASC LIMIT $${params.length + 1}`;
    params.push(topK);

    try {
      const results: any[] = await this.chunkRepository.query(sqlQuery, params);
      return results.map((row) => ({
        content: row.content,
        similarity: parseFloat(String(row.similarity)),
        pageNumber: row.pageNumber ?? null,
        chapterTitle: row.chapterTitle ?? null,
      }));
    } catch (error) {
      this.logger.error(`Failed to execute RAG search: ${error.message}`);
      throw error;
    }
  }
}
