import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import * as fs from 'fs/promises';
import { Repository } from 'typeorm';
import { Document } from '../../documents/entities/document.entity';
import { FileContent } from '../../documents/entities/file-content.entity';
import { CLEANUP_QUEUE, CleanupJob } from '../queue.constants';

@Processor(CLEANUP_QUEUE)
export class FileCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(FileCleanupProcessor.name);

  constructor(
    @InjectRepository(Document)
    private readonly documentsRepository: Repository<Document>,
    @InjectRepository(FileContent)
    private readonly fileContentRepository: Repository<FileContent>,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case CleanupJob.CLEANUP_FILE:
        return this.handleFileCleanup(job.data.fileContentHash);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleFileCleanup(fileContentHash: string) {
    this.logger.log(`Starting cleanup check for hash: ${fileContentHash}`);

    // Check if any documents still reference this file content
    const documentCount = await this.documentsRepository.count({
      where: { fileContentHash },
    });

    if (documentCount > 0) {
      this.logger.log(
        `File with hash ${fileContentHash} is still referenced by ${documentCount} documents. Skipping deletion.`,
      );
      return;
    }

    // No documents left, find the file content record
    const fileContent = await this.fileContentRepository.findOneBy({
      hash: fileContentHash,
    });

    if (!fileContent) {
      this.logger.warn(
        `FileContent record not found for hash: ${fileContentHash}`,
      );
      return;
    }

    // Delete physical file
    try {
      await fs.access(fileContent.fileUrl);
      await fs.unlink(fileContent.fileUrl);
      this.logger.log(`Deleted physical file: ${fileContent.fileUrl}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.logger.warn(`Physical file not found: ${fileContent.fileUrl}`);
      } else {
        this.logger.error(
          `Failed to delete physical file: ${fileContent.fileUrl}`,
          error.stack,
        );
        throw error; // Retry the job
      }
    }

    // Delete database record
    await this.fileContentRepository.remove(fileContent);
    this.logger.log(`Deleted FileContent record for hash: ${fileContentHash}`);
  }
}
