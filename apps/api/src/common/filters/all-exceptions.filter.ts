import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DbErrorHandlerRegistry } from '../database';
import { ErrorResponse, ValidationErrorDetail } from '../interfaces';
import { LoggerService } from '../logger';

/**
 * HTTP Status to Error Code mapping
 */
const HTTP_STATUS_TO_ERROR_CODE: Record<number, string> = {
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
 * All Exceptions Filter
 *
 * Global exception filter that catches ALL exceptions and returns
 * consistent error responses. This is the single point of error handling.
 *
 * Error handling priority:
 * 1. HttpException (including BusinessException) - extract error details
 * 2. Database errors - delegate to DbErrorHandlerRegistry
 * 3. Unknown errors - return generic INTERNAL_ERROR
 *
 * Flow: REQUEST → Guards → Interceptor → Pipes → Controller → Service
 *       SUCCESS: Response → Interceptor (wrap) → Client
 *       ERROR: Any point → THIS FILTER → Client
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly dbErrorRegistry: DbErrorHandlerRegistry;

  constructor(private readonly logger: LoggerService) {
    this.dbErrorRegistry = new DbErrorHandlerRegistry();
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const path = request.url;

    let errorResponse: ErrorResponse;

    // 1. Handle HttpException (includes NestJS built-in + BusinessException)
    if (exception instanceof HttpException) {
      errorResponse = this.handleHttpException(exception, path);
    }
    // 2. Handle database errors
    else if (this.dbErrorRegistry.canHandle(exception)) {
      errorResponse = this.handleDatabaseError(exception, path);
    }
    // 3. Handle unknown errors
    else {
      errorResponse = this.handleUnknownError(exception, path);
    }

    // Log the error with appropriate level
    this.logError(exception, errorResponse, request);

    // Send response
    response.status(errorResponse.error.statusCode).json(errorResponse);
  }

  /**
   * Handle HttpException including BusinessException and validation errors
   */
  private handleHttpException(
    exception: HttpException,
    path: string,
  ): ErrorResponse {
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

  /**
   * Handle database errors via DbErrorHandlerRegistry
   */
  private handleDatabaseError(exception: unknown, path: string): ErrorResponse {
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

    // Fallback if registry returned null (shouldn't happen if canHandle was true)
    return this.handleUnknownError(exception, path);
  }

  /**
   * Handle unknown/unexpected errors
   * Never expose internal details to clients
   */
  private handleUnknownError(exception: unknown, path: string): ErrorResponse {
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

  /**
   * Log errors with appropriate level and context
   * - 4xx errors: warn level
   * - 5xx errors: error level with stack trace
   */
  private logError(
    exception: unknown,
    errorResponse: ErrorResponse,
    request: Request,
  ): void {
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const statusCode = errorResponse.error.statusCode;
    const errorCode = errorResponse.error.errorCode;

    const logContext = {
      method,
      url,
      statusCode,
      errorCode,
      ip,
      userAgent,
    };

    // Client errors (4xx) - warn level
    if (statusCode >= 400 && statusCode < 500) {
      this.logger.warnWithMeta(
        `${errorCode}: ${errorResponse.error.message}`,
        logContext,
        'ExceptionFilter',
      );
    }
    // Server errors (5xx) - error level with stack trace
    else {
      const stack =
        exception instanceof Error ? exception.stack : String(exception);
      this.logger.errorWithMeta(
        `${errorCode}: ${errorResponse.error.message}`,
        stack,
        logContext,
        'ExceptionFilter',
      );
    }
  }
}
