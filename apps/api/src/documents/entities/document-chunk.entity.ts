import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractTimestampEntity } from '../../common/entities/base.entity';
import { FileContent } from './file-content.entity';

@Entity()
export class DocumentChunk extends AbstractTimestampEntity {
  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'vector', length: 3072, nullable: true })
  embedding: number[] | null;

  @Column({ type: 'int', nullable: true })
  tokenCount: number | null;

  @Column({ type: 'varchar', nullable: true })
  chapterTitle: string | null;

  @Column({ type: 'jsonb', nullable: true })
  headingPath: string[] | null;

  @Column({ type: 'text', nullable: true })
  semanticSummary: string | null;

  @Column({ type: 'int', nullable: true })
  pageNumber: number | null;

  @Column({ type: 'int', nullable: true })
  startOffset: number | null;

  @Column({ type: 'int', nullable: true })
  endOffset: number | null;

  @Column({ type: 'int' })
  index: number;

  @Column({ type: 'jsonb', nullable: true })
  contentTypes: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ type: 'boolean', default: false })
  isImportant: boolean;

  @ManyToOne(() => FileContent, (fileContent) => fileContent.chunks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'fileContentHash', referencedColumnName: 'hash' })
  fileContent: FileContent;

  @Column({ type: 'varchar', length: 64 })
  fileContentHash: string;
}
