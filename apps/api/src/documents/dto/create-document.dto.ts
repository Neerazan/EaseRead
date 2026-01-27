import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({
    description: 'The title of the document',
    required: false,
    example: '',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  readonly title?: string;

  @ApiProperty({
    description: 'The author of the document',
    required: false,
    example: '',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  readonly author?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'The file to upload',
  })
  @IsOptional()
  readonly file: Express.Multer.File;
}
