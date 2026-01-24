import { Expose } from 'class-transformer';
import { DocumentFormat } from '../entities/document.entity';

export class DocumentResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  author: string | null;

  @Expose()
  format: DocumentFormat;

  @Expose()
  fileUrl: string;

  @Expose()
  coverUrl: string | null;

  @Expose()
  isProcessed: boolean;

  @Expose()
  metadata: Record<string, any> | null;

  @Expose()
  fileSize: number;

  @Expose()
  totalPages: number;

  @Expose()
  wordsCount: number | null;

  @Expose()
  processedAt: Date | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
