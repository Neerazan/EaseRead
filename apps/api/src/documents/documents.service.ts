import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Repository } from 'typeorm';
import { CreateDocumentDto } from './dto/create-document.dto';
import { Document, DocumentFormat } from './entities/document.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentsRepository: Repository<Document>,
  ) {}

  async create(
    userId: string,
    createDocumentDto: CreateDocumentDto,
    file: Express.Multer.File,
  ): Promise<Document> {
    const format = this.mapMimeTypeToFormat(file.mimetype);

    const fileUrl = await this.uploadToLocal(file);

    const document = this.documentsRepository.create({
      ...createDocumentDto,
      title: createDocumentDto.title || file.originalname,
      author: createDocumentDto.author || null,
      userId,
      format,
      fileUrl,
      fileSize: file.size,
      isProcessed: false,
    });

    return this.documentsRepository.save(document);
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
