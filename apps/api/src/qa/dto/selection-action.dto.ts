import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum SelectionActionType {
  SUMMARIZE = 'summarize',
  EXPLAIN = 'explain',
  CONTEXT_MEANING = 'context_meaning',
  CUSTOM_QUESTION = 'custom_question',
}

export class SelectionActionDto {
  @ApiProperty({ enum: SelectionActionType })
  @IsEnum(SelectionActionType)
  action: SelectionActionType;

  @ApiProperty({ description: 'The text that the user specifically selected' })
  @IsString()
  @IsNotEmpty()
  selectedText: string;

  @ApiProperty({
    description: 'The surrounding text context of the selected text',
  })
  @IsString()
  @IsNotEmpty()
  surroundingContext: string;

  @ApiPropertyOptional({
    description: 'Required only if action is custom_question',
  })
  @IsOptional()
  @IsString()
  question?: string;

  @ApiPropertyOptional({ description: 'Current page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  currentPage?: number;
}
