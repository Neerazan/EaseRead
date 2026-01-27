import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractTimestampEntity } from '../../common/entities/base.entity';
import { Document } from './document.entity';

@Entity()
export class DocumentChunk extends AbstractTimestampEntity {
  @Column({ type: 'text' })
  content: string;

  // Assuming 1536 dimensions for OpenAI embeddings.
  // Note: The database must have the pgvector extension enabled.
  @Column({ type: 'vector', nullable: true })
  @Index({ spatial: true }) // Optional: Add HNSW index if needed immediately, but usually added via migration
  embedding: number[];

  @Column({ type: 'int', nullable: true })
  tokenCount: number;

  @Column({ type: 'varchar', nullable: true })
  chapterTitle: string;

  @Column({ type: 'int', nullable: true })
  pageNumber: number;

  @Column({ type: 'int', nullable: true })
  startOffset: number;

  @Column({ type: 'int', nullable: true })
  endOffset: number;

  @Column({ type: 'int' })
  index: number;

  @ManyToOne(() => Document, (document) => document.chunks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'documentId' })
  document: Document;

  @Column({ type: 'uuid' })
  documentId: string;
}
