import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ValidationError } from 'class-validator';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors';
import { ValidationErrorDetail } from './common/interfaces';
import { LoggerService } from './common/logger';

/**
 * Extracts and flattens validation error messages from ValidationError objects into field/message pairs.
 *
 * Nested property paths use dot notation (e.g., `parent.child`).
 *
 * @param errors - The array of ValidationError objects to process
 * @returns An array of ValidationErrorDetail objects where each item contains a `field` path (dot-separated for nested properties) and a `message`
 */
function extractValidationErrors(
  errors: ValidationError[],
): ValidationErrorDetail[] {
  const result: ValidationErrorDetail[] = [];

  for (const error of errors) {
    // Handle direct constraint violations
    if (error.constraints) {
      const messages = Object.values(error.constraints);
      for (const message of messages) {
        result.push({
          field: error.property,
          message,
        });
      }
    }

    // Handle nested validation errors (for nested DTOs)
    if (error.children && error.children.length > 0) {
      const nestedErrors = extractValidationErrors(error.children);
      for (const nested of nestedErrors) {
        result.push({
          field: `${error.property}.${nested.field}`,
          message: nested.message,
        });
      }
    }
  }

  return result;
}

/**
 * Bootstraps the NestJS application: configures logging, global validation behavior and response formatting, then starts the HTTP server.
 *
 * Configures a custom LoggerService, applies a ValidationPipe that strips unknown properties and transforms inputs while converting validation failures into a `BadRequestException` payload with `errorCode: 'VALIDATION_ERROR'`, `message: 'Validation failed'`, and a flattened `errors` array. Also applies a global response interceptor and listens on the port defined by `process.env.PORT` or `3000`, logging the startup message.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Use custom logger
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // Global validation pipe with custom exception factory
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const validationErrors = extractValidationErrors(errors);
        return new BadRequestException({
          errorCode: 'VALIDATION_ERROR',
          message: 'Validation failed',
          errors: validationErrors,
        });
      },
    }),
  );

  // Global interceptor for consistent success response format and logging
  app.useGlobalInterceptors(new ResponseInterceptor(logger));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application is running on port ${port}`, 'Bootstrap');
}
bootstrap();