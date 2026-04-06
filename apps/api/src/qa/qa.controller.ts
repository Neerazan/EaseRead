import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ApiTags } from '@nestjs/swagger';
import { ActiveUser } from 'src/iam/decorators/active-user.decorator';
import type { ActiveUserData } from 'src/iam/interfaces/action-user-data.interface';
import { AskQuestionDto } from './dto/ask-question.dto';
import { SelectionActionDto } from './dto/selection-action.dto';
import { ChatDto } from './dto/chat.dto';
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

  @Post(':id/selection-action')
  @Sse(':id/selection-action')
  async selectionAction(
    @ActiveUser() user: ActiveUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SelectionActionDto,
  ): Promise<Observable<any>> {
    const stream = await this.qaService.selectionAction(id, user.sub, dto);

    return new Observable((subscriber) => {
      (async () => {
        try {
          for await (const chunk of stream) {
            subscriber.next({ data: chunk });
          }
          subscriber.complete();
        } catch (err) {
          subscriber.error(err);
        }
      })();
    });
  }

  @Post(':id/chat')
  @Sse(':id/chat')
  async chat(
    @ActiveUser() user: ActiveUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChatDto,
  ): Promise<Observable<any>> {
    const stream = await this.qaService.chat(id, user.sub, dto);

    return new Observable((subscriber) => {
      (async () => {
        try {
          for await (const chunk of stream) {
            subscriber.next({ data: chunk });
          }
          subscriber.complete();
        } catch (err) {
          subscriber.error(err);
        }
      })();
    });
  }
}
