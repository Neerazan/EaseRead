import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorResponse, ValidationErrorDetail } from '../../interfaces';

/**
 * HTTP Status to Error Code mapping
 */
export const HTTP_STATUS_TO_ERROR_CODE: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.METHOD_NOT_ALLOWED]: 'METHOD_NOT_ALLOWED',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
  [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
  [HttpStatus.BAD_GATEWAY]: 'BAD_GATEWAY',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
};

/**
 * Handles HttpExceptions (including built-in NestJS exceptions and BusinessException)
 */
export class HttpExceptionHandler {
  handle(exception: HttpException, path: string): ErrorResponse {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let errorCode: string;
    let message: string;
    let field: string | undefined;
    let details: ValidationErrorDetail[] | undefined;

    // Handle object response (custom exceptions, validation errors)
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as Record<string, unknown>;

      // Check for errorCode (BusinessException, custom HttpExceptions)
      errorCode =
        (resp.errorCode as string) ||
        HTTP_STATUS_TO_ERROR_CODE[status] ||
        'ERROR';

      // Handle validation errors from ValidationPipe
      if (resp.errorCode === 'VALIDATION_ERROR' && Array.isArray(resp.errors)) {
        details = resp.errors as ValidationErrorDetail[];
        message = (resp.message as string) || 'Validation failed';
      } else {
        message =
          (resp.message as string) || exception.message || 'An error occurred';
        field = resp.field as string | undefined;
      }
    }
    // Handle string response
    else {
      errorCode = HTTP_STATUS_TO_ERROR_CODE[status] || 'ERROR';
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : exception.message;
    }

    return {
      success: false,
      error: {
        statusCode: status,
        errorCode,
        message,
        ...(field && { field }),
        ...(details && { details }),
      },
      timestamp: new Date().toISOString(),
      path,
    };
  }
}
