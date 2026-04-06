import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentChunk } from '../documents/entities/document-chunk.entity';
import { DocumentsService } from '../documents/documents.service';
import { EmbeddingService } from './embedding.service';

import { ChatMessage } from './entities/chat-message.entity';
import { LlmService } from './llm.service';
import { RagSearchService } from './rag-search.service';
import {
  SelectionActionDto,
  SelectionActionType,
} from './dto/selection-action.dto';
import { ChatDto } from './dto/chat.dto';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

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
    @InjectRepository(ChatMessage)
    private readonly chatRepository: Repository<ChatMessage>,
    private readonly documentsService: DocumentsService,
    private readonly embeddingService: EmbeddingService,
    private readonly llmService: LlmService,
    private readonly ragSearchService: RagSearchService,
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

  /**
   * Pipeline B: Explain, Summarize, or Contextual Queries on selected text using Tool-Calling Agent.
   */
  async selectionAction(
    documentId: string,
    userId: string,
    dto: SelectionActionDto,
  ): Promise<AsyncGenerator<any>> {
    const document = await this.documentsService.findOne(documentId, userId);

    let prompt = 'You are a helpful reading companion. ';
    switch (dto.action) {
      case SelectionActionType.SUMMARIZE:
        prompt += 'Summarize the selected text concisely in simple terms.';
        break;
      case SelectionActionType.EXPLAIN:
        prompt += 'Explain the selected text, including its intent and tone.';
        break;
      case SelectionActionType.CONTEXT_MEANING:
        prompt +=
          'Explain the meaning of the selected word/phrase within the provided context.';
        break;
      case SelectionActionType.CUSTOM_QUESTION:
        prompt +=
          "Answer the user's question about the selected text using the context provided.";
        break;
    }

    return this.llmService.streamSelectionActionAgent(
      document.fileContentHash,
      document.preventSpoilers,
      prompt,
      dto.selectedText,
      dto.surroundingContext,
      dto.question,
      dto.currentPage,
    );
  }

  /**
   * Pipeline C: Persistent Chat about the document (Progress-Aware RAG).
   */
  async *chat(
    documentId: string,
    userId: string,
    dto: ChatDto,
  ): AsyncGenerator<string> {
    const document = await this.documentsService.findOne(documentId, userId);

    // 1. Fetch History
    const history = await this.chatRepository.find({
      where: { documentId, userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    // Reverse to chronological order for LangChain
    history.reverse();
    history.pop(); // Remove the message the user just sent if we stored it prematurely... wait we haven't stored it yet.

    const lcHistory = history.map((msg) =>
      msg.role === 'user'
        ? new HumanMessage(msg.content)
        : new AIMessage(msg.content),
    );

    // 2. Perform PgVector Search (RAG)
    const ragResults = await this.ragSearchService.search(
      dto.message,
      document.fileContentHash,
      document.preventSpoilers,
      dto.maxPageRead,
      5,
    );
    const contextStr = ragResults
      .map((r) => `[Page: ${r.pageNumber || 'Unknown'}] ${r.content}`)
      .join('\\n\\n');

    // 3. Prepare Stream
    const systemPrompt =
      "You are an AI reading assistant. Use the following context retrieved from the book to reliably answer the user's question without revealing spoilers beyond their max page read if spoiler prevention is active.";

    const stream = await this.llmService.streamChatChain(
      dto.message,
      contextStr,
      lcHistory,
      systemPrompt,
    );

    // 4. Save User Message
    await this.chatRepository.save(
      this.chatRepository.create({
        documentId,
        userId,
        role: 'user',
        content: dto.message,
      }),
    );

    // 5. Stream Chunks to client and aggregate
    let assistantFullResponse = '';
    for await (const chunk of stream) {
      assistantFullResponse += chunk;
      yield chunk;
    }

    // 6. Save Assistant Response
    await this.chatRepository.save(
      this.chatRepository.create({
        documentId,
        userId,
        role: 'assistant',
        content: assistantFullResponse,
      }),
    );
  }
}
