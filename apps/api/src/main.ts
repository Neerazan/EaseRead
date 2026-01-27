import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ValidationError } from 'class-validator';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors';
import { ValidationErrorDetail } from './common/interfaces';
import { LoggerService } from './common/logger';
import appConfig from './config/app.config';

function extractValidationErrors(
  errors: ValidationError[],
): ValidationErrorDetail[] {
  const result: ValidationErrorDetail[] = [];

  for (const error of errors) {
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
  const appConfiguration = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);

  app.useLogger(logger);
  app.use(cookieParser(appConfiguration.cookieSecret));

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

  app.useGlobalInterceptors(new ResponseInterceptor(logger));

  const config = new DocumentBuilder()
    .setTitle('EaseRead APIs')
    .setDescription('All Rest APIs related to our easeread app')
    .setVersion('1.0')
    .addTag('EaseRead')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application is running on port ${port}`, 'Bootstrap');
}
bootstrap();
