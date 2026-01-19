import { HttpStatus, Injectable } from '@nestjs/common';
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
