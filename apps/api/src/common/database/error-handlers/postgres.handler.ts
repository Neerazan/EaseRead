import { HttpStatus, Injectable } from '@nestjs/common';
import { DbErrorResponse } from '../../interfaces';
import { DbErrorHandler } from '../interfaces';

/**
 * PostgreSQL Error Handler
 *
 * Handles PostgreSQL-specific database errors and converts them to user-friendly responses.
 * PostgreSQL uses string error codes (e.g., '23505' for unique violation).
 *
 * Error Code Reference:
 * - 23505: unique_violation (duplicate key)
 * - 23503: foreign_key_violation
 * - 23502: not_null_violation
 * - 22001: string_data_right_truncation (data too long)
 *
 * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
@Injectable()
export class PostgresErrorHandler implements DbErrorHandler {
  /**
   * Checks if the error is a PostgreSQL driver error.
   * PostgreSQL errors have a `code` property that is a string.
   */
  canHandle(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const err = error as Record<string, unknown>;

    // PostgreSQL errors typically have a string code like '23505'
    // and often have a 'detail' property with additional info
    return (
      typeof err.code === 'string' &&
      /^\d{5}$/.test(err.code) &&
      ('detail' in err || 'constraint' in err || 'table' in err)
    );
  }

  handle(error: unknown): DbErrorResponse {
    const err = error as Record<string, unknown>;
    const code = err.code as string;
    const detail = (err.detail as string) || '';

    switch (code) {
      case '23505': // unique_violation
        return {
          statusCode: HttpStatus.CONFLICT,
          errorCode: 'DUPLICATE_ENTRY',
          message: 'This value already exists',
          field: this.extractFieldFromDetail(detail),
        };

      case '23503': // foreign_key_violation
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: 'FOREIGN_KEY_VIOLATION',
          message: 'Referenced record does not exist',
          field: this.extractFieldFromDetail(detail),
        };

      case '23502': // not_null_violation
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: 'REQUIRED_FIELD',
          message: 'This field is required',
          field: (err.column as string) || undefined,
        };

      case '22001': // string_data_right_truncation
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: 'VALUE_TOO_LONG',
          message: 'The provided value is too long',
          field: undefined,
        };

      default:
        // Fallback for unhandled PostgreSQL errors
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          errorCode: 'DATABASE_ERROR',
          message: 'A database error occurred',
        };
    }
  }

  /**
   * Extracts field name from PostgreSQL error detail message.
   * Example: "Key (email)=(test@example.com) already exists." → "email"
   */
  private extractFieldFromDetail(detail: string): string | undefined {
    // Pattern: "Key (field_name)=" or "(field_name)"
    const match = detail.match(/Key \(([^)]+)\)/i);
    if (match) {
      return match[1];
    }

    // Alternative pattern for some error messages
    const altMatch = detail.match(/column "([^"]+)"/i);
    if (altMatch) {
      return altMatch[1];
    }

    return undefined;
  }
}
