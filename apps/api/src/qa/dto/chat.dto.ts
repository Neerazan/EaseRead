import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class ChatDto {
  @ApiProperty({ description: 'The message from the user' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'The current page the user is viewing' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  currentPage: number;

  @ApiProperty({
    description:
      'The maximum page the user has read so far for spoiler prevention',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxPageRead: number;
}
