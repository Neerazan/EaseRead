import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ActiveUser } from 'src/iam/decorators/active-user.decorator';
import type { ActiveUserData } from 'src/iam/interfaces/action-user-data.interface';
import { AskQuestionDto } from './dto/ask-question.dto';
import { QaService } from './qa.service';

@ApiTags('Q&A')
@Controller('documents')
export class QaController {
  constructor(private readonly qaService: QaService) {}

  @Post(':id/ask')
  @HttpCode(HttpStatus.OK)
  async ask(
    @ActiveUser() user: ActiveUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() askQuestionDto: AskQuestionDto,
  ) {
    return this.qaService.ask(
      id,
      user.sub,
      askQuestionDto.question,
      askQuestionDto.topK,
    );
  }
}
