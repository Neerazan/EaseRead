import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
// @ts-ignore - TS module resolution struggles with LangChain exports here
import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { BaseMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { RagSearchService } from './rag-search.service';
import geminiConfig from '../config/gemini.config';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(
    @Inject(geminiConfig.KEY)
    private readonly config: ConfigType<typeof geminiConfig>,
    private readonly ragSearchService: RagSearchService,
  ) {}

  /**
   * Return a raw Google GenAI chat model instance wrapper.
   */
  getModel(temperature: number = 0.2): ChatGoogleGenerativeAI {
    return new ChatGoogleGenerativeAI({
      apiKey: this.config.apiKey,
      model: this.config.chatModel, // Changed from modelName to model
      temperature,
    });
  }

  /**
   * Helper to build the `search_book` tool for the agent.
   */
  private buildSearchTool(
    fileContentHash: string,
    preventSpoilers: boolean,
    currentMaxPageRead?: number,
  ) {
    return tool(
      async ({ query, maxPageRead }) => {
        this.logger.debug(`LLM invoking search_book tool for query: ${query}`);

        const effectiveMaxPage = maxPageRead || currentMaxPageRead;
        const results = await this.ragSearchService.search(
          query,
          fileContentHash,
          preventSpoilers,
          effectiveMaxPage,
          5,
        );

        if (results.length === 0) {
          return 'No relevant information found in the book.';
        }

        return results
          .map((r) => `[Page: ${r.pageNumber || 'Unknown'}] ${r.content}`)
          .join('\n\n--- \n\n');
      },
      {
        name: 'search_book',
        description:
          'Search the book for context about specific characters, places, terms, or events across the entire text.',
        schema: z.object({
          query: z
            .string()
            .describe(
              'The specific term or concept to search for in the book.',
            ),
          maxPageRead: z
            .number()
            .optional()
            .describe(
              'The maximum page number the user has reached. Pass this if provided in the prompt.',
            ),
        }),
      },
    );
  }

  /**
   * Executes a streaming Tool-Calling Agent for the Selection Action pipeline.
   * If context is insufficient, the LLM will call the `search_book` tool.
   */
  async streamSelectionActionAgent(
    fileContentHash: string,
    preventSpoilers: boolean,
    actionPrompt: string, // Rigid prompt telling the LLM what to do
    selectedText: string,
    surroundingContext: string,
    question?: string,
    currentPage?: number,
  ): Promise<AsyncGenerator<any>> {
    const model = this.getModel(0.2);
    const searchTool = this.buildSearchTool(
      fileContentHash,
      preventSpoilers,
      currentPage,
    );
    const tools = [searchTool];

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        actionPrompt +
          `\n\nUse the provided Context to answer. If the immediate Context is insufficient, you MUST use the 'search_book' tool to find more information.`,
      ],
      [
        'human',
        `Word/Selection: {selectedText}\nContext: {surroundingContext}\nQuestion: {question}`,
      ],
      ['placeholder', '{agent_scratchpad}'],
    ]);

    const agent = createToolCallingAgent({ llm: model, tools, prompt });
    const executor = new AgentExecutor({ agent, tools });

    return executor.streamEvents(
      {
        selectedText,
        surroundingContext,
        question: question || 'N/A',
      },
      { version: 'v2' },
    );
  }

  /**
   * Executes a streaming Chat Chain for the General Chat pipeline.
   */
  async streamChatChain(
    chatMessage: string,
    contextChunks: string, // Evaluated via RAG before calling
    chatHistoryData: BaseMessage[],
    systemPrompt: string,
  ): Promise<AsyncGenerator<any>> {
    const model = this.getModel(0.4);

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        systemPrompt +
          `\n\nRelevant chunks retrieved from the book:\n{context}`,
      ],
      new MessagesPlaceholder('history'),
      ['human', '{message}'],
    ]);

    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    return chain.stream({
      context: contextChunks,
      history: chatHistoryData,
      message: chatMessage,
    });
  }
}
