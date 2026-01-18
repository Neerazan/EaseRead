import { HttpStatus, Injectable } from '@nestjs/common';
import { DbErrorResponse } from '../../interfaces';
import { DbErrorHandler } from '../interfaces';

/**
 * MySQL Error Handler
 *
 * Handles MySQL-specific database errors and converts them to user-friendly responses.
 * MySQL uses numeric error codes (e.g., 1062 for duplicate entry).
 *
 * Error Code Reference:
 * - 1062: ER_DUP_ENTRY (duplicate entry for key)
 * - 1452: ER_NO_REFERENCED_ROW_2 (foreign key constraint fails)
 * - 1048: ER_BAD_NULL_ERROR (column cannot be null)
 * - 1406: ER_DATA_TOO_LONG (data too long for column)
 *
 * @see https://dev.mysql.com/doc/mysql-errors/8.0/en/server-error-reference.html
 */
@Injectable()
export class MySQLErrorHandler implements DbErrorHandler {
  /**
   * Checks if the error is a MySQL driver error.
   * MySQL errors have numeric `errno` and `code` like 'ER_DUP_ENTRY'.
   */
  canHandle(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const err = error as Record<string, unknown>;

    // MySQL errors have errno (number) and code like 'ER_DUP_ENTRY'
    return (
      typeof err.errno === 'number' &&
      typeof err.code === 'string' &&
      err.code.startsWith('ER_')
    );
  }

  handle(error: unknown): DbErrorResponse {
    const err = error as Record<string, unknown>;
    const errno = err.errno as number;
    const message = (err.message as string) || '';

    switch (errno) {
      case 1062: // ER_DUP_ENTRY
        return {
          statusCode: HttpStatus.CONFLICT,
          errorCode: 'DUPLICATE_ENTRY',
          message: 'This value already exists',
          field: this.extractFieldFromMessage(message, 'duplicate'),
        };

      case 1452: // ER_NO_REFERENCED_ROW_2
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: 'FOREIGN_KEY_VIOLATION',
          message: 'Referenced record does not exist',
          field: this.extractFieldFromMessage(message, 'foreign_key'),
        };

      case 1048: // ER_BAD_NULL_ERROR
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: 'REQUIRED_FIELD',
          message: 'This field is required',
          field: this.extractFieldFromMessage(message, 'null'),
        };

      case 1406: // ER_DATA_TOO_LONG
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: 'VALUE_TOO_LONG',
          message: 'The provided value is too long',
          field: this.extractFieldFromMessage(message, 'too_long'),
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
   * Extracts field name from MySQL error message.
   */
  private extractFieldFromMessage(
    message: string,
    type: string,
  ): string | undefined {
    switch (type) {
      case 'duplicate': {
        // Pattern: "Duplicate entry 'value' for key 'table.field_UNIQUE'"
        const match = message.match(/for key '(?:[^.]+\.)?([^'_]+)/i);
        return match ? match[1] : undefined;
      }
      case 'null': {
        // Pattern: "Column 'field' cannot be null"
        const match = message.match(/Column '([^']+)'/i);
        return match ? match[1] : undefined;
      }
      case 'too_long': {
        // Pattern: "Data too long for column 'field'"
        const match = message.match(/column '([^']+)'/i);
        return match ? match[1] : undefined;
      }
      case 'foreign_key': {
        // Pattern: "FOREIGN KEY (`field`) REFERENCES"
        const match = message.match(/FOREIGN KEY \(`([^`]+)`\)/i);
        return match ? match[1] : undefined;
      }
      default:
        return undefined;
    }
  }
}
