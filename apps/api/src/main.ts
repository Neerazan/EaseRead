import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ValidationError } from 'class-validator';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors';
import { ValidationErrorDetail } from './common/interfaces';
import { LoggerService } from './common/logger';

/**
 * Recursively extracts validation error messages from nested ValidationError objects.
 * Handles both flat and nested DTO validation scenarios.
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
