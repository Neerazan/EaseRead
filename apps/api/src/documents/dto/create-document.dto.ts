import { IsString, IsOptional, MaxLength, maxLength } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  readonly title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  readonly author?: string;
}
