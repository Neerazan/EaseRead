import { HttpStatus } from '@nestjs/common';
import { DbErrorResponse } from '../../interfaces';
import { DbErrorHandler } from '../interfaces';

/**
 * MongoDB Error Handler
 *
 * Handles MongoDB-specific database errors and converts them to user-friendly responses.
 * MongoDB uses numeric error codes accessible via the `code` property.
 *
 * Error Code Reference:
 * - 11000: DuplicateKey (duplicate key error)
 *
 * @see https://www.mongodb.com/docs/manual/reference/error-codes/
 */
export class MongoErrorHandler implements DbErrorHandler {
  /**
   * Checks if the error is a MongoDB driver error.
   * MongoDB errors have a numeric `code` and often `keyPattern` or `keyValue`.
   */
  canHandle(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const err = error as Record<string, unknown>;

    // MongoDB errors have numeric code and MongoDB-specific properties
    return (
      typeof err.code === 'number' &&
      ('keyPattern' in err ||
        'keyValue' in err ||
        (err.name as string)?.includes('Mongo'))
    );
  }

  handle(error: unknown): DbErrorResponse {
    const err = error as Record<string, unknown>;
    const code = err.code as number;

    switch (code) {
      case 11000: // DuplicateKey
        return {
          statusCode: HttpStatus.CONFLICT,
          errorCode: 'DUPLICATE_ENTRY',
          message: 'This value already exists',
          field: this.extractFieldFromKeyPattern(err),
        };

      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          errorCode: 'DATABASE_ERROR',
          message: 'A database error occurred',
        };
    }
  }

  /**
   * Extracts field name from MongoDB keyPattern or keyValue.
   * Example: { keyPattern: { email: 1 } } → "email"
   */
  private extractFieldFromKeyPattern(
    error: Record<string, unknown>,
  ): string | undefined {
    // Try keyPattern first (contains the field names that caused the error)
    if (error.keyPattern && typeof error.keyPattern === 'object') {
      const keys = Object.keys(error.keyPattern as Record<string, unknown>);
      return keys[0];
    }

    // Fallback to keyValue
    if (error.keyValue && typeof error.keyValue === 'object') {
      const keys = Object.keys(error.keyValue as Record<string, unknown>);
      return keys[0];
    }

    // Try parsing the error message
    const message = error.message as string;
    if (message) {
      // Pattern: "duplicate key error collection: db.collection index: field_1"
      const match = message.match(/index:\s+(\w+)_/i);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }
}
