/**
 * Response Interfaces
 *
 * Defines consistent API response structures for both success and error cases.
 * These interfaces ensure frontend can reliably parse all API responses.
 */

/**
 * Standard success response wrapper
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  path: string;
}

/**
 * Validation error detail for individual fields
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
}

/**
 * Error detail structure within error responses
 */
export interface ErrorDetail {
  statusCode: number;
  errorCode: string;
  message: string;
  field?: string;
  details?: ValidationErrorDetail[];
}

/**
 * Standard error response wrapper
 */
export interface ErrorResponse {
  success: false;
  error: ErrorDetail;
  timestamp: string;
  path: string;
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * Response from database error handlers
 * Returned by DbErrorHandler implementations when they can handle an error
 */
export interface DbErrorResponse {
  statusCode: number;
  errorCode: string;
  message: string;
  field?: string;
}
