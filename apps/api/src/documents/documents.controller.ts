import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  ParseFilePipeBuilder,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { ActiveUser } from 'src/iam/decorators/active-user.decorator';
import type { ActiveUserData } from 'src/iam/interfaces/action-user-data.interface';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentResponseDto } from './dto/document-response.dto';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async upload(
    @ActiveUser() user: ActiveUserData,
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(pdf|epub|plain)$/,
        })
        .addMaxSizeValidator({
          maxSize: 10 * 1024 * 1024,
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
  ) {
    const document = await this.documentsService.create(
      user.sub,
      createDocumentDto,
      file,
    );
    return plainToInstance(DocumentResponseDto, document, {
      excludeExtraneousValues: true,
    });
  }
}
