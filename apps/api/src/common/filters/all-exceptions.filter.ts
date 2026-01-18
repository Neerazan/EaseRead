import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from '../interfaces';
import { LoggerService } from '../logger';
import {
  DatabaseExceptionHandler,
  HttpExceptionHandler,
  UnknownExceptionHandler,
} from './handlers';

/**
 * All Exceptions Filter
 *
 * Global exception filter that catches ALL exceptions and returns
 * consistent error responses.
 *
 * Refactored to delegate logic to specialized handlers:
 * - HttpExceptionHandler
 * - DatabaseExceptionHandler
 * - UnknownExceptionHandler
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly logger: LoggerService,
    private readonly httpHandler: HttpExceptionHandler,
    private readonly dbHandler: DatabaseExceptionHandler,
    private readonly unknownHandler: UnknownExceptionHandler,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const path = request.url;

    let errorResponse: ErrorResponse;

    // 1. Handle HttpException
    if (exception instanceof HttpException) {
      errorResponse = this.httpHandler.handle(exception, path);
    }
    // 2. Handle database errors
    else if (this.dbHandler.canHandle(exception)) {
      const dbResponse = this.dbHandler.handle(exception, path);
      // Fallback to unknown handler if dbHandler returns null (unlikely if canHandle is true)
      errorResponse = dbResponse || this.unknownHandler.handle(exception, path);
    }
    // 3. Handle unknown errors
    else {
      errorResponse = this.unknownHandler.handle(exception, path);
    }

    // Log the error with appropriate level
    this.logError(exception, errorResponse, request);

    // Send response
    response.status(errorResponse.error.statusCode).json(errorResponse);
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
