import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import geminiConfig from '../config/gemini.config';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly model;

  constructor(
    @Inject(geminiConfig.KEY)
    private readonly config: ConfigType<typeof geminiConfig>,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(config.apiKey!);
    this.model = genAI.getGenerativeModel({
      model: config.embeddingModel,
    });

    this.logger.log(
      `EmbeddingService initialized (model=${config.embeddingModel}, dim=${config.embeddingDimension})`,
    );
  }

  /**
   * Generate an embedding vector for a single query text.
   */
  async embedQuery(text: string): Promise<number[]> {
    const result = await this.model.embedContent(text);
    return result.embedding.values;
  }
}
