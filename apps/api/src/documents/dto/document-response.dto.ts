import { Expose, Transform } from 'class-transformer';
import { DocumentFormat } from '../enum/document-format.enum';

export class DocumentResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  author: string | null;

  @Expose()
  @Transform(({ obj }) => obj.fileContent?.format)
  format: DocumentFormat;

  @Expose()
  @Transform(({ obj }) => obj.fileContent?.fileUrl)
  fileUrl: string;

  @Expose()
  coverUrl: string | null;

  @Expose()
  @Transform(({ obj }) => obj.fileContent?.isProcessed)
  isProcessed: boolean;

  @Expose()
  @Transform(({ obj }) => obj.fileContent?.metadata)
  metadata: Record<string, any> | null;

  @Expose()
  @Transform(({ obj }) => obj.fileContent?.fileSize)
  fileSize: number;

  @Expose()
  @Transform(({ obj }) => obj.fileContent?.totalPages)
  totalPages: number | null;

  @Expose()
  @Transform(({ obj }) => obj.fileContent?.wordsCount)
  wordsCount: number | null;

  @Expose()
  @Transform(({ obj }) => obj.fileContent?.processedAt)
  processedAt: Date | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
