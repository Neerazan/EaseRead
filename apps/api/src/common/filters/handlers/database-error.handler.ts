import { DbErrorHandlerRegistry } from '../../database';
import { ErrorResponse } from '../../interfaces';

/**
 * Handles database errors by delegating to the DbErrorHandlerRegistry
 */
export class DatabaseExceptionHandler {
  constructor(private readonly dbErrorRegistry: DbErrorHandlerRegistry) {}

  canHandle(exception: unknown): boolean {
    return this.dbErrorRegistry.canHandle(exception);
  }

  handle(exception: unknown, path: string): ErrorResponse | null {
    const dbError = this.dbErrorRegistry.handleError(exception);

    if (dbError) {
      return {
        success: false,
        error: {
          statusCode: dbError.statusCode,
          errorCode: dbError.errorCode,
          message: dbError.message,
          ...(dbError.field && { field: dbError.field }),
        },
        timestamp: new Date().toISOString(),
        path,
      };
    }

    return null;
  }
}
