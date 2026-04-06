import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { DictionaryService } from './dictionary.service';
import { AuthType } from '../iam/authentication/enum/auth-type.enum';
import { Auth } from '../iam/authentication/decorators/auth.decorator';

@ApiTags('Dictionary')
@Controller('dictionary')
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  @Get()
  @Auth(AuthType.Bearer, AuthType.None) // Dictionary is free to use, maybe optional auth
  @ApiQuery({ name: 'word', required: true, type: String })
  async lookup(@Query('word') word: string) {
    if (!word)
      throw new BadRequestException('Word query parameter is required');
    return this.dictionaryService.lookup(word);
  }
}
