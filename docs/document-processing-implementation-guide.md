# 📋 Document Embeddings & Background Workers Implementation Guide

This document outlines the step-by-step implementation guide for document parsing, chunking, embedding generation, and background workers using NestJS Queue (BullMQ).

---

## 🏗️ Recommended Folder Structure

```
apps/api/src/
├── queue/                          # Queue module (BullMQ setup)
│   ├── queue.module.ts             # BullModule registration
│   ├── queue.constants.ts          # Queue names, job types constants
│   └── queue.config.ts             # Queue configuration (Redis connection)
│
├── document-processing/            # Document processing domain
│   ├── document-processing.module.ts
│   ├── processors/                 # Job processors (consumers)
│   │   ├── document.processor.ts   # Main orchestrator processor
│   │   ├── parsing.processor.ts    # Document parsing jobs
│   │   ├── chunking.processor.ts   # Text chunking jobs
│   │   └── embedding.processor.ts  # Embedding generation jobs
│   ├── services/
│   │   ├── document-parser.service.ts         # Parsing logic (PDF, EPUB, TXT)
│   │   ├── text-chunker.service.ts            # Chunking strategies
│   │   ├── embedding-generator.service.ts     # OpenAI/Local embeddings
│   │   └── processing-orchestrator.service.ts # Job coordination
│   ├── strategies/                 # Strategy pattern for parsers
│   │   ├── parser.interface.ts
│   │   ├── pdf-parser.strategy.ts
│   │   ├── epub-parser.strategy.ts
│   │   └── txt-parser.strategy.ts
│   ├── dto/
│   │   ├── processing-job.dto.ts
│   │   └── chunk-result.dto.ts
│   └── interfaces/
│       ├── parsed-document.interface.ts
│       └── chunk.interface.ts
│
├── embedding/                      # Embedding service (optional separate module)
│   ├── embedding.module.ts
│   ├── embedding.service.ts        # Vector generation logic
│   ├── providers/
│   │   ├── embedding-provider.interface.ts
│   │   ├── openai-embedding.provider.ts
│   │   └── local-embedding.provider.ts  # Future: local models
│   └── embedding.config.ts
│
└── documents/                      # (existing module - modify)
    ├── documents.service.ts        # Add job dispatch logic
    └── ...
```

---

## 🔧 Step-by-Step Implementation Guide

### Phase 1: Queue Infrastructure Setup

#### Step 1.1: Install Required Packages

You'll need to install:

**Queue & Background Jobs:**
- `@nestjs/bullmq` - NestJS wrapper for BullMQ
- `bullmq` - The queue library (uses Redis under the hood)

**Document Parsing:**
- `pdf-parse` or `pdf2json` - For PDF parsing
- `epub2` or `epubjs` - For EPUB parsing

**Tokenization:**
- `tiktoken` or `gpt-tokenizer` - For token counting (OpenAI compatible)

**OpenAI Integration:**
- `openai` - Official OpenAI SDK

```bash
# Install queue packages
yarn workspace @easeread/api add @nestjs/bullmq bullmq

# Install parsing libraries
yarn workspace @easeread/api add pdf-parse epub2

# Install tokenization
yarn workspace @easeread/api add tiktoken

# Install OpenAI SDK
yarn workspace @easeread/api add openai

# Install types
yarn workspace @easeread/api add -D @types/pdf-parse
```

#### Step 1.2: Create Queue Module

Create a dedicated `QueueModule` that:
1. Configures BullMQ to use your existing **Redis connection** (you already have `ioredis`)
2. Registers all queue names as constants
3. Exports the Bull module for use in other modules

**Key Configuration Points:**
- Use your existing Redis configuration from `redis/` module
- Define queue names: `DOCUMENT_PROCESSING`, `PARSING`, `CHUNKING`, `EMBEDDING`
- Configure job options: attempts, backoff strategy, timeout

**Example Configuration:**
```typescript
// queue.module.ts
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: DOCUMENT_PROCESSING_QUEUE },
      { name: PARSING_QUEUE },
      { name: CHUNKING_QUEUE },
      { name: EMBEDDING_QUEUE },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
```

#### Step 1.3: Define Queue Constants

Create a constants file with queue names and job types:

```typescript
// queue.constants.ts

// Queue Names
export const DOCUMENT_PROCESSING_QUEUE = 'document-processing';
export const PARSING_QUEUE = 'document-parsing';
export const CHUNKING_QUEUE = 'text-chunking';
export const EMBEDDING_QUEUE = 'embedding-generation';

// Job Types
export enum DocumentJobType {
  PROCESS_DOCUMENT = 'process-document',
}

export enum ParsingJobType {
  PARSE_PDF = 'parse-pdf',
  PARSE_EPUB = 'parse-epub',
  PARSE_TXT = 'parse-txt',
}

export enum ChunkingJobType {
  CHUNK_TEXT = 'chunk-text',
}

export enum EmbeddingJobType {
  GENERATE_EMBEDDINGS = 'generate-embeddings',
  GENERATE_BATCH_EMBEDDINGS = 'generate-batch-embeddings',
}
```

---

### Phase 2: Document Processing Pipeline

The processing follows this flow:

```
Upload → Dispatch Job → Parse Document → Chunk Text → Generate Embeddings → Update DB
```

#### Step 2.1: Processing Orchestrator Service

This service **dispatches the initial job** when a document is uploaded:

1. Called from `documents.service.ts` after file upload
2. Adds a job to the `document-processing` queue
3. Job payload includes: `fileContentHash`, `fileUrl`, `format`

**Example Interface:**
```typescript
interface ProcessDocumentJobPayload {
  fileContentHash: string;
  fileUrl: string;
  format: DocumentFormat;
  documentId: string;
}
```

#### Step 2.2: Main Document Processor

This is the **orchestrator processor** that:
1. Listens to the `document-processing` queue
2. Dispatches sub-jobs to specialized queues (parsing → chunking → embedding)
3. Uses **BullMQ Flow** (job dependencies) or sequential job chaining

**Two Approaches:**

| Approach | Pros | Cons |
|----------|------|------|
| **Flow-based** | Better observability, automatic dependency tracking | More complex setup |
| **Sequential** | Simpler, each processor triggers next | Harder to track overall progress |

**Recommendation:** Use **Flow-based** with BullMQ's `FlowProducer` for better observability and retry handling.

---

### Phase 3: Document Parsing

#### Step 3.1: Parser Strategy Interface

Create an interface that all parsers implement:

```typescript
// parser.interface.ts
interface DocumentParser {
  parse(filePath: string): Promise<ParsedDocument>;
  supports(format: DocumentFormat): boolean;
}

interface ParsedDocument {
  rawText: string;
  metadata: {
    title?: string;
    author?: string;
    totalPages?: number;
    chapters?: ChapterInfo[];
  };
  structure: DocumentStructure[]; // Chapters, sections, paragraphs
}

interface ChapterInfo {
  title: string;
  startOffset: number;
  endOffset: number;
}

interface DocumentStructure {
  type: 'chapter' | 'section' | 'paragraph';
  content: string;
  metadata?: {
    chapterTitle?: string;
    pageNumber?: number;
    startOffset?: number;
    endOffset?: number;
  };
}
```

#### Step 3.2: Implement Format-Specific Parsers

**PDF Parser:**
- Use `pdf-parse` or `pdf2json`
- Extract text per page
- Handle multi-column layouts (if needed)
- Extract metadata (title, author, page count)

```typescript
// pdf-parser.strategy.ts
@Injectable()
export class PdfParserStrategy implements DocumentParser {
  supports(format: DocumentFormat): boolean {
    return format === DocumentFormat.PDF;
  }

  async parse(filePath: string): Promise<ParsedDocument> {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    
    return {
      rawText: data.text,
      metadata: {
        totalPages: data.numpages,
        title: data.info?.Title,
        author: data.info?.Author,
      },
      structure: this.extractStructure(data),
    };
  }
}
```

**EPUB Parser:**
- Use `epub2` or `epubjs`
- Navigate spine/chapters
- Extract chapter titles
- Preserve section structure

**TXT Parser:**
- Simple file read
- Paragraph detection by double newlines
- No metadata extraction needed

#### Step 3.3: Parsing Processor

The processor that:
1. Downloads file from storage URL
2. Determines format and selects parser
3. Executes parsing
4. Stores parsed result (or passes to next job)
5. Triggers chunking job

```typescript
// parsing.processor.ts
@Processor(PARSING_QUEUE)
export class ParsingProcessor {
  constructor(
    private readonly parserFactory: ParserFactory,
    @InjectQueue(CHUNKING_QUEUE) private chunkingQueue: Queue,
  ) {}

  @Process()
  async handleParsing(job: Job<ParsingJobPayload>) {
    const { fileUrl, format, fileContentHash } = job.data;
    
    // 1. Download file to temp location
    const tempPath = await this.downloadFile(fileUrl);
    
    // 2. Get appropriate parser
    const parser = this.parserFactory.getParser(format);
    
    // 3. Parse document
    const parsedDocument = await parser.parse(tempPath);
    
    // 4. Dispatch chunking job
    await this.chunkingQueue.add('chunk-text', {
      fileContentHash,
      parsedDocument,
    });
    
    // 5. Cleanup temp file
    await fs.unlink(tempPath);
    
    return { status: 'parsed', chunks: parsedDocument.structure.length };
  }
}
```

---

### Phase 4: Text Chunking

#### Step 4.1: Chunking Strategy

Design your chunking approach:

**Recommended Strategy - Semantic Chunking:**
1. **Primary Split**: By chapter/section from parsed structure
2. **Secondary Split**: By paragraph within sections
3. **Token-Aware**: Split large paragraphs to stay under token limit (e.g., 500-800 tokens per chunk)
4. **Overlap**: Include ~50-100 token overlap between chunks for context continuity

**Chunking Configuration:**
```typescript
interface ChunkingConfig {
  maxTokensPerChunk: number;  // e.g., 512
  overlapTokens: number;       // e.g., 50
  minTokensPerChunk: number;   // e.g., 100 (don't create tiny chunks)
}

// Default values
const DEFAULT_CHUNKING_CONFIG: ChunkingConfig = {
  maxTokensPerChunk: 512,
  overlapTokens: 50,
  minTokensPerChunk: 100,
};
```

#### Step 4.2: Text Chunker Service

Implement logic to:
1. Receive parsed document with structure
2. Split text according to strategy
3. Calculate token count per chunk using `tiktoken`
4. Assign sequential `index` to each chunk
5. Preserve metadata: chapter title, page number, offsets

```typescript
// text-chunker.service.ts
@Injectable()
export class TextChunkerService {
  private encoder: Tiktoken;

  constructor() {
    this.encoder = encoding_for_model('text-embedding-ada-002');
  }

  chunkDocument(parsedDocument: ParsedDocument, config: ChunkingConfig): Chunk[] {
    const chunks: Chunk[] = [];
    let currentIndex = 0;

    for (const structure of parsedDocument.structure) {
      const structureChunks = this.chunkText(
        structure.content,
        config,
        structure.metadata,
      );

      for (const chunk of structureChunks) {
        chunks.push({
          ...chunk,
          index: currentIndex++,
        });
      }
    }

    return chunks;
  }

  private chunkText(text: string, config: ChunkingConfig, metadata?: any): Chunk[] {
    // Token-aware splitting with overlap
    const tokens = this.encoder.encode(text);
    const chunks: Chunk[] = [];
    
    let start = 0;
    while (start < tokens.length) {
      const end = Math.min(start + config.maxTokensPerChunk, tokens.length);
      const chunkTokens = tokens.slice(start, end);
      
      chunks.push({
        content: this.encoder.decode(chunkTokens),
        tokenCount: chunkTokens.length,
        ...metadata,
      });
      
      start = end - config.overlapTokens;
    }
    
    return chunks;
  }
}
```

#### Step 4.3: Chunking Processor

1. Receives parsed document from parsing job
2. Calls chunker service
3. **Creates `DocumentChunk` entities** (without embeddings yet)
4. Saves chunks to database with `embedding: null`
5. Dispatches embedding jobs (can batch chunks)

```typescript
// chunking.processor.ts
@Processor(CHUNKING_QUEUE)
export class ChunkingProcessor {
  constructor(
    private readonly chunkerService: TextChunkerService,
    private readonly documentChunkRepository: Repository<DocumentChunk>,
    @InjectQueue(EMBEDDING_QUEUE) private embeddingQueue: Queue,
  ) {}

  @Process('chunk-text')
  async handleChunking(job: Job<ChunkingJobPayload>) {
    const { fileContentHash, parsedDocument, documentId } = job.data;
    
    // 1. Chunk the document
    const chunks = this.chunkerService.chunkDocument(parsedDocument);
    
    // 2. Save chunks to database (without embeddings)
    const savedChunks = await this.documentChunkRepository.save(
      chunks.map(chunk => ({
        documentId,
        content: chunk.content,
        tokenCount: chunk.tokenCount,
        index: chunk.index,
        chapterTitle: chunk.chapterTitle,
        pageNumber: chunk.pageNumber,
        startOffset: chunk.startOffset,
        endOffset: chunk.endOffset,
        embedding: null,
      })),
    );
    
    // 3. Dispatch embedding jobs in batches
    const chunkIds = savedChunks.map(c => c.id);
    const batchSize = 100;
    
    for (let i = 0; i < chunkIds.length; i += batchSize) {
      await this.embeddingQueue.add('generate-batch-embeddings', {
        chunkIds: chunkIds.slice(i, i + batchSize),
        fileContentHash,
        isLastBatch: i + batchSize >= chunkIds.length,
      });
    }
    
    return { status: 'chunked', totalChunks: chunks.length };
  }
}
```

---

### Phase 5: Embedding Generation

#### Step 5.1: Embedding Provider Interface

Create a provider abstraction for future flexibility:

```typescript
// embedding-provider.interface.ts
export interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
  getDimension(): number;
  getModelName(): string;
}
```

#### Step 5.2: OpenAI Embedding Provider

Implement OpenAI integration:

```typescript
// openai-embedding.provider.ts
@Injectable()
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private client: OpenAI;
  private readonly model = 'text-embedding-ada-002';
  private readonly dimension = 1536;

  constructor(private configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  getDimension(): number {
    return this.dimension;
  }

  getModelName(): string {
    return this.model;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: text,
    });
    return response.data[0].embedding;
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    // OpenAI supports batch embedding (up to 2048 texts per request)
    const response = await this.client.embeddings.create({
      model: this.model,
      input: texts,
    });
    return response.data.map(d => d.embedding);
  }
}
```

**Important Considerations:**
- OpenAI batch limit: Max 8191 tokens per input
- Implement exponential backoff for rate limits
- Consider queueing in smaller batches (e.g., 100 chunks per job)

#### Step 5.3: Embedding Processor

1. Receives batch of chunk IDs
2. Fetches chunk content from database
3. Calls embedding provider (in batches)
4. Updates `DocumentChunk.embedding` column
5. After all chunks done, updates `FileContent.isProcessed = true`

```typescript
// embedding.processor.ts
@Processor(EMBEDDING_QUEUE)
export class EmbeddingProcessor {
  constructor(
    private readonly embeddingProvider: EmbeddingProvider,
    private readonly documentChunkRepository: Repository<DocumentChunk>,
    private readonly fileContentRepository: Repository<FileContent>,
  ) {}

  @Process('generate-batch-embeddings')
  async handleBatchEmbedding(job: Job<BatchEmbeddingJobPayload>) {
    const { chunkIds, fileContentHash, isLastBatch } = job.data;
    
    // 1. Fetch chunks
    const chunks = await this.documentChunkRepository.findByIds(chunkIds);
    
    // 2. Generate embeddings
    const texts = chunks.map(c => c.content);
    const embeddings = await this.embeddingProvider.generateBatchEmbeddings(texts);
    
    // 3. Update chunks with embeddings
    await Promise.all(
      chunks.map((chunk, index) =>
        this.documentChunkRepository.update(chunk.id, {
          embedding: embeddings[index],
        }),
      ),
    );
    
    // 4. If last batch, mark file as processed
    if (isLastBatch) {
      await this.fileContentRepository.update(
        { hash: fileContentHash },
        { isProcessed: true, processedAt: new Date() },
      );
    }
    
    return { status: 'embedded', count: chunks.length };
  }
}
```

---

### Phase 6: Integration with Existing Code

#### Step 6.1: Modify Documents Service

After file upload in `documents.service.ts`:

1. Create `Document` and `FileContent` entities (as you do now)
2. **Add**: Call `processingOrchestrator.dispatchProcessingJob(fileContentHash)`
3. Return immediately - processing happens in background

```typescript
// documents.service.ts (modified)
@Injectable()
export class DocumentsService {
  constructor(
    private readonly processingOrchestrator: ProcessingOrchestratorService,
    // ... existing dependencies
  ) {}

  async uploadDocument(file: Express.Multer.File, userId: string) {
    // ... existing upload logic ...
    
    // After saving Document and FileContent entities:
    await this.processingOrchestrator.dispatchProcessingJob({
      fileContentHash: fileContent.hash,
      fileUrl: fileContent.fileUrl,
      format: fileContent.format,
      documentId: document.id,
    });
    
    return document;
  }
}
```

#### Step 6.2: Processing Status Tracking

Consider adding a `processingStatus` enum to `FileContent`:

```typescript
// processing-status.enum.ts
export enum ProcessingStatus {
  PENDING = 'pending',
  PARSING = 'parsing',
  CHUNKING = 'chunking',
  EMBEDDING = 'embedding',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
```

Add columns to `FileContent` entity:
- `processingStatus: ProcessingStatus`
- `processingError: string | null`
- `lastProcessingStep: string | null`

#### Step 6.3: Real-Time Status Updates (Optional)

If you want live updates:

**Option A: Polling Endpoint**
```typescript
// documents.controller.ts
@Get(':id/processing-status')
async getProcessingStatus(@Param('id') id: string) {
  return this.documentsService.getProcessingStatus(id);
}
```

**Option B: WebSocket Events**
- Use `@nestjs/websockets` with Socket.io
- Emit progress events from processors
- Client subscribes to document-specific channel

---

### Phase 7: Error Handling & Resilience

#### Step 7.1: Job Retry Strategy

Configure BullMQ with retry options:

```typescript
// Default job options
const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000, // 5s, 10s, 20s
  },
  removeOnComplete: true,
  removeOnFail: false, // Keep for debugging
};
```

#### Step 7.2: Dead Letter Queue

- Failed jobs after max attempts go to DLQ
- Create admin endpoint to inspect/retry failed jobs

```typescript
// processors should handle failures gracefully
@OnWorkerEvent('failed')
onFailed(job: Job, error: Error) {
  this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack);
  
  // Update processing status to FAILED
  this.updateProcessingStatus(job.data.fileContentHash, ProcessingStatus.FAILED, error.message);
}
```

#### Step 7.3: Idempotency

Make jobs idempotent (safe to re-run):

- Check if chunk already has embedding before regenerating
- Use `fileContentHash` as natural idempotency key
- Use `jobId` option to prevent duplicate jobs

```typescript
// When adding jobs, use deterministic job IDs
await this.queue.add(
  'process-document',
  payload,
  {
    jobId: `process-${fileContentHash}`, // Prevents duplicates
  },
);
```

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         User Upload                          │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Documents Service                         │
│  1. Save file to S3                                         │
│  2. Create Document + FileContent entities                  │
│  3. Dispatch to Queue ─────────────────────────┐            │
└─────────────────────────────────────────────────┼───────────┘
                                                  │
                                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                         Redis                                │
│  ┌─────────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ document-queue  │  │ chunk-queue │  │ embedding-queue │  │
│  └─────────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
            │                   │                  │
            ▼                   ▼                  ▼
┌───────────────────┐  ┌──────────────┐  ┌─────────────────┐
│  Parsing Worker   │  │ Chunk Worker │  │ Embedding Worker│
│  ┌─────────────┐  │  │              │  │                 │
│  │ PDF Parser  │  │  │  Semantic    │  │  OpenAI API     │
│  │ EPUB Parser │──┼──▶ Chunking   ──┼──▶ text-embedding │
│  │ TXT Parser  │  │  │  Strategy    │  │  ada-002        │
│  └─────────────┘  │  └──────────────┘  └─────────────────┘
└───────────────────┘                              │
                                                   ▼
                                    ┌─────────────────────────┐
                                    │       PostgreSQL        │
                                    │   ┌───────────────────┐ │
                                    │   │  DocumentChunk    │ │
                                    │   │  + embedding      │ │
                                    │   │  (pgvector)       │ │
                                    │   └───────────────────┘ │
                                    └─────────────────────────┘
```

---

## 🎯 Implementation Order

Recommended implementation order:

| Step | Task | Description |
|------|------|-------------|
| 1 | **Queue Module Setup** | Get BullMQ working with Redis |
| 2 | **Simple Test Processor** | Validate queue consumption works |
| 3 | **TXT Parser** | Simplest format to start with |
| 4 | **Chunking Service** | Token-aware splitting |
| 5 | **Embedding Service** | OpenAI integration |
| 6 | **Document Processor** | Full pipeline orchestration |
| 7 | **PDF Parser** | More complex parsing |
| 8 | **EPUB Parser** | Last, most complex |
| 9 | **Error Handling** | Retries, DLQ, monitoring |
| 10 | **Status Tracking** | Processing status endpoints |

---

## 💡 Key Design Decisions

Before coding, decide on:

| Decision | Options | Recommendation |
|----------|---------|----------------|
| **Job Flow** | Sequential vs Flow-based | **Flow-based** (BullMQ FlowProducer) |
| **Chunk Storage** | Create all then embed vs stream | Create all first, then batch embed |
| **Embedding Batching** | Per chunk vs batch | **Batch** (100-500 chunks per job) |
| **Progress Tracking** | Polling vs WebSocket | Start with **polling**, add WebSocket later |
| **Parsing Libraries** | pdf-parse vs pdf2json | **pdf-parse** (simpler API) |

---

## 📚 Environment Variables to Add

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-...

# Embedding Configuration
EMBEDDING_MODEL=text-embedding-ada-002
EMBEDDING_DIMENSION=1536

# Chunking Configuration (optional, can use defaults)
CHUNK_MAX_TOKENS=512
CHUNK_OVERLAP_TOKENS=50
CHUNK_MIN_TOKENS=100

# Queue Configuration (optional, uses existing Redis)
QUEUE_DEFAULT_ATTEMPTS=3
QUEUE_BACKOFF_DELAY=5000
```

---

## 🔗 Related Documentation

- [Database Architecture](./database-architecture.md) - Entity definitions and relationships
- [Project Description](./project-description.md) - Feature requirements and technical design

---

*Last updated: 2026-01-28*
