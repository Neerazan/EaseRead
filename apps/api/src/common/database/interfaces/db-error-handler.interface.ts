import { DbErrorResponse } from '../../interfaces';

/**
 * Database Error Handler Interface
 *
 * Defines the contract for database-specific error handlers.
 * Each database driver (PostgreSQL, MySQL, MongoDB) implements this interface
 * to translate its specific errors into user-friendly responses.
 *
 * Uses Strategy Pattern - handlers are registered with DbErrorHandlerRegistry
 * which routes errors to the appropriate handler.
 */
export interface DbErrorHandler {
  /**
   * Check if this handler can process the given error.
   * Should examine error properties to determine if it originates
   * from the database this handler is designed for.
   *
   * @param error - The error to check
   * @returns true if this handler can process the error
   */
  canHandle(error: unknown): boolean;

  /**
   * Process the database error and return a user-friendly response.
   * Should only be called if canHandle() returned true.
   *
   * @param error - The database error to handle
   * @returns Structured error response with status, code, message, and optional field
   */
  handle(error: unknown): DbErrorResponse;
}
