import { Injectable, Logger, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';

@Injectable()
export class DictionaryService {
  private readonly logger = new Logger(DictionaryService.name);
  private readonly DICTIONARY_API_URL =
    'https://api.dictionaryapi.dev/api/v2/entries/en';
  private readonly CACHE_TTL_SECONDS = 86400; // 24 hours

  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {}

  async lookup(word: string): Promise<any> {
    const cacheKey = `dict:${word.toLowerCase().trim()}`;

    // Check Redis cache first
    try {
      const cached = await this.redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      this.logger.warn(`Redis get failed for key ${cacheKey}`);
    }

    // Call external API
    try {
      const response = await fetch(
        `${this.DICTIONARY_API_URL}/${encodeURIComponent(word)}`,
      );
      if (!response.ok) {
        if (response.status === 404) {
          return null; // Word not found
        }
        throw new Error(`Dictionary API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Save to cache
      try {
        await this.redisClient.set(
          cacheKey,
          JSON.stringify(data),
          'EX',
          this.CACHE_TTL_SECONDS,
        );
      } catch (e) {
        this.logger.warn(`Redis set failed for key ${cacheKey}`);
      }

      return data;
    } catch (error) {
      this.logger.error(`Lookup failed for word "${word}": ${error.message}`);
      throw error;
    }
  }
}
