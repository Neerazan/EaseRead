import { InjectQueue } from '@nestjs/bullmq';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { createHash, randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Repository } from 'typeorm';
import {
  CLEANUP_QUEUE,
  CleanupJob,
  DOCUMENT_PROCESSING_QUEUE,
  DocumentProcessingJob,
} from '../queue/queue.constants';
import { CreateDocumentDto } from './dto/create-document.dto';
import { GetDocumentsQueryDto } from './dto/get-documents-query.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Document } from './entities/document.entity';
import { FileContent } from './entities/file-content.entity';
import { DocumentFormat } from './enum/document-format.enum';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectRepository(Document)
    private readonly documentsRepository: Repository<Document>,
    @InjectRepository(FileContent)
    private readonly fileContentRepository: Repository<FileContent>,
    @InjectQueue(CLEANUP_QUEUE)
    private readonly cleanupQueue: Queue,
    @InjectQueue(DOCUMENT_PROCESSING_QUEUE)
    private readonly documentProcessingQueue: Queue,
  ) {}

  async create(
    userId: string,
    createDocumentDto: CreateDocumentDto,
    file: Express.Multer.File,
  ): Promise<Document> {
    const hash = createHash('sha256').update(file.buffer).digest('hex');
    let fileUrl: string | null = null;
    let format: DocumentFormat = DocumentFormat.PDF;

    const existingFileContent = await this.fileContentRepository.findOneBy({
      hash,
    });

    if (!existingFileContent) {
      format = this.mapMimeTypeToFormat(file.mimetype);
      fileUrl = await this.uploadToLocal(file);
    } else {
      fileUrl = existingFileContent.fileUrl;
      format = existingFileContent.format;
    }

    let savedDocument: Document;

    try {
      savedDocument = await this.documentsRepository.manager.transaction(
        async (manager) => {
          let fileContent = await manager.findOneBy(FileContent, { hash });

          if (!fileContent) {
            fileContent = manager.create(FileContent, {
              hash,
              fileUrl: fileUrl!,
              format,
              fileSize: file.size,
              isProcessed: false,
            });
            await manager.save(FileContent, fileContent);
          }

          const existingDocument = await manager.findOne(Document, {
            where: {
              userId,
              fileContentHash: fileContent.hash,
            },
            relations: ['fileContent'],
          });

          if (existingDocument) {
            return existingDocument;
          }

          const document = manager.create(Document, {
            ...createDocumentDto,
            title: createDocumentDto.title || file.originalname,
            author: createDocumentDto.author || null,
            userId,
            fileContentHash: fileContent.hash,
          });

          const saved = await manager.save(Document, document);
          return (await manager.findOne(Document, {
            where: { id: saved.id },
            relations: ['fileContent'],
          })) as Document;
        },
      );
    } catch (error) {
      if (!existingFileContent && fileUrl) {
        await fs
          .unlink(fileUrl)
          .catch((e) =>
            this.logger.warn(`Failed to cleanup orphaned file: ${e.message}`),
          );
      }
      throw error;
    }

    try {
      if (!savedDocument.fileContent.isProcessed) {
        console.log('This is inside documen service queue.');
        await this.documentProcessingQueue.add(
          DocumentProcessingJob.PROCESS_DOCUMENT,
          {
            documentId: savedDocument.id,
            fileUrl: savedDocument.fileContent.fileUrl,
            userId,
            format: savedDocument.fileContent.format,
          },
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to queue document ${savedDocument.id} for processing: ${error.message}`,
        error.stack,
      );

      throw new InternalServerErrorException(
        'Document saved but failed to start processing. Please contact support.',
      );
    }

    return savedDocument;
  }

  async findAll(
    userId: string,
    query: GetDocumentsQueryDto,
  ): Promise<Document[]> {
    const { search, page = 1, limit = 10 } = query;

    const queryBuilder = this.documentsRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.fileContent', 'fileContent')
      .where('document.userId = :userId', { userId });

    if (search) {
      // Professional Postgres FTS logic:
      // 1. Combine title and author into a search vector
      // 2. Use plainto_tsquery for the search term (safe against special chars)
      // 3. Match using the @@ operator
      queryBuilder.andWhere(
        "to_tsvector('english', document.title || ' ' || COALESCE(document.author, '')) @@ plainto_tsquery('english', :search)",
        { search },
      );
    }

    // Apply pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    // Default sort by creation date
    queryBuilder.orderBy('document.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  async findOne(id: string, userId: string): Promise<Document> {
    const document = await this.documentsRepository.findOne({
      where: { id, userId },
      relations: ['fileContent'],
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return document;
  }

  async update(
    id: string,
    userId: string,
    updateDocumentDto: UpdateDocumentDto,
  ): Promise<Document> {
    const document = await this.findOne(id, userId);
    Object.assign(document, updateDocumentDto);
    return this.documentsRepository.save(document);
  }

  async remove(id: string, userId: string): Promise<void> {
    const document = await this.findOne(id, userId);
    const { fileContentHash } = document;

    await this.documentsRepository.remove(document);

    await this.cleanupQueue.add(CleanupJob.CLEANUP_FILE, {
      fileContentHash,
    });
  }

  private mapMimeTypeToFormat(mimeType: string): DocumentFormat {
    switch (mimeType) {
      case 'application/pdf':
        return DocumentFormat.PDF;
      case 'application/epub+zip':
        return DocumentFormat.EPUB;
      case 'text/plain':
        return DocumentFormat.TXT;
      default:
        return DocumentFormat.PDF;
    }
  }

  private async uploadToLocal(file: Express.Multer.File): Promise<string> {
    try {
      const uploadDir = path.join(process.cwd(), 'uploads');
      await fs.mkdir(uploadDir, { recursive: true });

      const fileExt = path.extname(file.originalname);
      const fileName = `${randomUUID()}${fileExt}`;
      const filePath = path.join(uploadDir, fileName);

      await fs.writeFile(filePath, file.buffer);

      return filePath;
    } catch (error) {
      throw new InternalServerErrorException('Failed to store file upload');
    }
  }
}
