import { Injectable } from '@nestjs/common';
import { DbErrorResponse } from '../../interfaces';
import { DbErrorHandler } from '../interfaces';
import { MongoErrorHandler } from './mongo.handler';
import { MySQLErrorHandler } from './mysql.handler';
import { PostgresErrorHandler } from './postgres.handler';

/**
 * Database Error Handler Registry
 *
 * Central registry for all database error handlers.
 * Uses the Strategy Pattern to route database errors to the appropriate handler
 * based on the error type (PostgreSQL, MySQL, MongoDB).
 *
 * This design is easily extensible - to add support for a new database:
 * 1. Create a new handler class implementing DbErrorHandler
 * 2. Register it in the constructor below
 *
 * @example
 * // In a service or filter:
 * const result = this.dbErrorRegistry.handleError(error);
 * if (result) {
 *   // It was a database error, use result.statusCode, result.errorCode, etc.
 * } else {
 *   // Not a database error, handle differently
 * }
 */
@Injectable()
export class DbErrorHandlerRegistry {
  private readonly handlers: DbErrorHandler[] = [];

  constructor() {
    // Register all database handlers
    // Order matters - more specific handlers should come first
    this.handlers.push(new PostgresErrorHandler());
    this.handlers.push(new MySQLErrorHandler());
    this.handlers.push(new MongoErrorHandler());
  }

  /**
   * Attempts to handle a database error.
   * Iterates through registered handlers until one can process the error.
   *
   * @param error - The error to handle
   * @returns DbErrorResponse if a handler processed the error, null otherwise
   */
  handleError(error: unknown): DbErrorResponse | null {
    for (const handler of this.handlers) {
      if (handler.canHandle(error)) {
        return handler.handle(error);
      }
    }
    return null;
  }

  /**
   * Checks if any registered handler can process the given error.
   *
   * @param error - The error to check
   * @returns true if a handler exists for this error type
   */
  canHandle(error: unknown): boolean {
    return this.handlers.some((handler) => handler.canHandle(error));
  }

  /**
   * Register an additional error handler.
   * Useful for extending with custom database handlers at runtime.
   *
   * @param handler - The handler to register
   */
  registerHandler(handler: DbErrorHandler): void {
    this.handlers.push(handler);
  }
}
