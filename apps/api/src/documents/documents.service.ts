import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Repository } from 'typeorm';
import { CreateDocumentDto } from './dto/create-document.dto';
import { Document } from './entities/document.entity';
import { FileContent } from './entities/file-content.entity';
import { DocumentFormat } from './enum/document-format.enum';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentsRepository: Repository<Document>,
    @InjectRepository(FileContent)
    private readonly fileContentRepository: Repository<FileContent>,
  ) {}

  async create(
    userId: string,
    createDocumentDto: CreateDocumentDto,
    file: Express.Multer.File,
  ): Promise<Document> {
    const hash = createHash('sha256').update(file.buffer).digest('hex');
    let fileContent = await this.fileContentRepository.findOneBy({ hash });

    if (!fileContent) {
      const format = this.mapMimeTypeToFormat(file.mimetype);
      const fileUrl = await this.uploadToLocal(file);

      fileContent = this.fileContentRepository.create({
        hash,
        fileUrl,
        format,
        fileSize: file.size,
        isProcessed: false,
      });
      await this.fileContentRepository.save(fileContent);
    }

    const existingDocument = await this.documentsRepository.findOne({
      where: {
        userId,
        fileContentHash: fileContent.hash,
      },
      relations: ['fileContent'],
    });

    if (existingDocument) {
      return existingDocument;
    }

    const document = this.documentsRepository.create({
      ...createDocumentDto,
      title: createDocumentDto.title || file.originalname,
      author: createDocumentDto.author || null,
      userId,
      fileContentHash: fileContent.hash,
    });

    const savedDocument = await this.documentsRepository.save(document);

    return this.documentsRepository.findOne({
      where: { id: savedDocument.id },
      relations: ['fileContent'],
    }) as Promise<Document>;
  }

  async findAll(userId: string): Promise<Document[]> {
    return this.documentsRepository.find({
      where: { userId },
      relations: ['fileContent'],
    });
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
