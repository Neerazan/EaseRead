import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractTimestampEntity } from '../../common/entities/base.entity';
import { Document } from './document.entity';

@Entity()
export class DocumentChunk extends AbstractTimestampEntity {
  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'vector', length: 1536, nullable: true })
  embedding: number[] | null;

  @Column({ type: 'int', nullable: true })
  tokenCount: number | null;

  @Column({ type: 'varchar', nullable: true })
  chapterTitle: string | null;

  @Column({ type: 'int', nullable: true })
  pageNumber: number | null;

  @Column({ type: 'int', nullable: true })
  startOffset: number | null;

  @Column({ type: 'int', nullable: true })
  endOffset: number | null;

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
