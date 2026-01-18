import { HttpStatus } from '@nestjs/common';
import { ErrorResponse } from '../../interfaces';

/**
 * Handles unknown/unexpected errors
 */
export class UnknownExceptionHandler {
  handle(exception: unknown, path: string): ErrorResponse {
    return {
      success: false,
      error: {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errorCode: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again later.',
      },
      timestamp: new Date().toISOString(),
      path,
    };
  }
}
