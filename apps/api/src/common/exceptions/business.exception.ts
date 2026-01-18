import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Business Exception
 *
 * Custom exception for domain/business logic errors.
 * Use this when a business rule is violated, not for validation or database errors.
 *
 * @example
 * // Insufficient balance
 * throw new BusinessException(
 *   'INSUFFICIENT_BALANCE',
 *   'Your account balance is too low for this transaction',
 * );
 *
 * @example
 * // Age restriction with custom status
 * throw new BusinessException(
 *   'AGE_RESTRICTION',
 *   'You must be 18 or older to register',
 *   HttpStatus.FORBIDDEN,
 * );
 */
export class BusinessException extends HttpException {
  constructor(
    public readonly errorCode: string,
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        errorCode,
        message,
      },
      statusCode,
    );
  }
}
