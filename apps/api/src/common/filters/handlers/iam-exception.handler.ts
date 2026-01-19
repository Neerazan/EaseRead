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

  canHandle(exception: any): boolean {
    return (
      this.jwtErrorNames.includes(exception?.name) ||
      exception instanceof InvalidateRefreshTokenError ||
      exception?.message?.includes('jwt') ||
      exception?.message?.includes('JWT')
    );
  }

  handle(exception: any, path: string): ErrorResponse {
    let errorCode = 'UNAUTHORIZED';
    let message = 'Authentication failed';

    if (exception.name === 'TokenExpiredError') {
      errorCode = 'TOKEN_EXPIRED';
      message = 'Your session has expired.';
    } else if (exception.name === 'JsonWebTokenError') {
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
