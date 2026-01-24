import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DocumentFormat } from '../enum/document-format.enum';
import { Document } from './document.entity';

@Entity()
export class FileContent {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  hash: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'text' })
  fileUrl: string;

  @Column({
    type: 'enum',
    enum: DocumentFormat,
  })
  format: DocumentFormat;

  @Column({
    type: 'bigint',
    transformer: {
      to: (value?: number) => value,
      from: (value: string) => Number(value),
    },
  })
  fileSize: number;

  @Column({ type: 'boolean', default: false })
  isProcessed: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ type: 'int', nullable: true })
  totalPages: number | null;

  @Column({ type: 'int', nullable: true })
  wordsCount: number | null;

  @OneToMany(() => Document, (document) => document.fileContent)
  documents: Document[];
}
