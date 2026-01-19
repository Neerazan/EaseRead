import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.constants';

export class InvalidateRefreshTokenError extends Error {
  constructor(message = 'Refresh Token invalid or has already been used') {
    super(message);
    this.name = 'InvalidateRefreshTokenError';
  }
}

@Injectable()
export class RefreshTokenIdsStorage {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  async insert(userId: string, tokenId: string, ttl: number): Promise<void> {
    await this.redisClient.set(this.getKey(userId), tokenId, 'EX', ttl);
  }

  /**
   * Validates and invalidates a refresh token in a single atomic operation.
   * This prevents race conditions (TOCTOU) where multiple concurrent refresh
   * requests might attempt to rotate the same token.
   *
   * @param userId The ID of the user the token belongs to
   * @param tokenId The unique ID of the refresh token to validate
   * @throws InvalidateRefreshTokenError If the token is invalid or already used
   */
  async validateAndInvalidate(userId: string, tokenId: string): Promise<void> {
    const key = this.getKey(userId);
    const script = `
      -- 1. Get the current token ID stored for this user
      local currentToken = redis.call("get", KEYS[1])
      
      -- 2. Check if the provided tokenId matches the stored one
      if currentToken == ARGV[1] then
        -- 3. If it matches, delete it and return 1 (true)
        return redis.call("del", KEYS[1])
      else
        -- 4. If it doesn't match or doesn't exist, return 0 (false)
        return 0
      end
    `;

    const result = await this.redisClient.eval(script, 1, key, tokenId);

    if (result === 0) {
      throw new InvalidateRefreshTokenError();
    }
  }

  private getKey(userId: string): string {
    return `user-${userId}`;
  }
}
