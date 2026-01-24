import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { Document } from './entities/document.entity';
import { FileContent } from './entities/file-content.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Document, FileContent])],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
