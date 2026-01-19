import { HttpStatus, Injectable } from '@nestjs/common';
import { InvalidateRefreshTokenError } from '../../../iam/authentication/refresh-token-ids.storage';
import { ErrorResponse } from '../../interfaces';

/**
 * Handles IAM related errors (JWT, Authentication, etc.)
 */
@Injectable()
export class IamExceptionHandler {
  private readonly jwtErrorNames = [
    'TokenExpiredError',
    'JsonWebTokenError',
    'NotBeforeError',
  ];

  private asError(exception: unknown): Partial<Error> {
    return typeof exception === 'object' && exception !== null
      ? (exception as Partial<Error>)
      : {};
  }

  canHandle(exception: unknown): boolean {
    const err = this.asError(exception);
    const message = typeof err.message === 'string' ? err.message : '';
    return (
      this.jwtErrorNames.includes(err.name ?? '') ||
      exception instanceof InvalidateRefreshTokenError ||
      // /jwt/i.test(message)
      false
    );
  }

  handle(exception: unknown, path: string): ErrorResponse {
    const err = this.asError(exception);
    let errorCode = 'UNAUTHORIZED';
    let message = 'Authentication failed';

    if (err.name === 'TokenExpiredError') {
      errorCode = 'TOKEN_EXPIRED';
      message = 'Your session has expired.';
    } else if (err.name === 'JsonWebTokenError') {
      errorCode = 'INVALID_TOKEN';
      message = 'The provided token is invalid or malformed.';
    } else if (exception instanceof InvalidateRefreshTokenError) {
      errorCode = 'INVALID_REFRESH_TOKEN';
      message = exception.message || 'The refresh token is no longer valid.';
    }

    return {
      success: false,
      error: {
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode,
        message,
      },
      timestamp: new Date().toISOString(),
      path,
    };
  }
}
