import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ActiveUser } from 'src/iam/decorators/active-user.decorator';
import type { ActiveUserData } from 'src/iam/interfaces/action-user-data.interface';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentResponseDto } from './dto/document-response.dto';
import { GetDocumentsQueryDto } from './dto/get-documents-query.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateDocumentDto,
  })
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

  @Get()
  async getAll(
    @ActiveUser() user: ActiveUserData,
    @Query() query: GetDocumentsQueryDto,
  ) {
    const documents = await this.documentsService.findAll(user.sub, query);
    return plainToInstance(DocumentResponseDto, documents, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id')
  async getOne(
    @ActiveUser() user: ActiveUserData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const document = await this.documentsService.findOne(id, user.sub);
    return plainToInstance(DocumentResponseDto, document, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  async update(
    @ActiveUser() user: ActiveUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    const document = await this.documentsService.update(
      id,
      user.sub,
      updateDocumentDto,
    );
    return plainToInstance(DocumentResponseDto, document, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @ActiveUser() user: ActiveUserData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.documentsService.remove(id, user.sub);
  }
}
