import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

enum format {
  EPUB = 'epub',
  PDF = 'pdf',
  TXT = 'txt',
}

@Entity()
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  author: string;

  @Column({ type: 'enum', enum: format, default: format.PDF })
  format: 'epub' | 'pdf' | 'txt';

  @Column({ type: 'text' })
  fileUrl: string;

  @Column({ type: 'text', nullable: true })
  coverUrl: string;

  @Column({ type: 'boolean', default: false })
  isProcessed: boolean;

  @Column({ type: 'timestamptz' })
  uploadedAt: Date;

  @Column({ type: 'float' })
  fileSize: number;

  @Column({ type: 'number' })
  totalPages: number;

  @Column({ type: 'number', nullable: true })
  wordsCount: number;
}
