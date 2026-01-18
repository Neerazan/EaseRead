import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: winston.Logger;
  private readonly isDevelopment: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isDevelopment =
      this.configService.get<string>('NODE_ENV') !== 'production';

    this.logger = winston.createLogger({
      level: this.isDevelopment ? 'debug' : 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'easeread-api' },
      transports: this.getTransports(),
    });
  }

  private getTransports(): winston.transport[] {
    const transports: winston.transport[] = [];

    // Console transport (always enabled)
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize({ all: true }),
          winston.format.timestamp({ format: 'HH:mm:ss' }),
          winston.format.printf(
            ({ timestamp, level, message, context, ...meta }) => {
              const ctx = context ? `[${context}]` : '';
              const metaStr =
                Object.keys(meta).length > 1 ? ` ${JSON.stringify(meta)}` : '';
              return `${timestamp} ${level} ${ctx} ${message}${metaStr}`;
            },
          ),
        ),
      }),
    );

    // File transports (always enabled for persistence)
    // All logs
    transports.push(
      new winston.transports.DailyRotateFile({
        filename: 'logs/app-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    );

    // Error logs only
    transports.push(
      new winston.transports.DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    );

    return transports;
  }

  log(message: string, context?: string): void {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, { context, trace });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(message, { context });
  }

  /**
   * Log with additional metadata
   */
  logWithMeta(
    message: string,
    meta?: Record<string, unknown>,
    context?: string,
  ): void {
    this.logger.info(message, { context, ...meta });
  }

  /**
   * Error with additional metadata
   */
  errorWithMeta(
    message: string,
    trace?: string,
    meta?: Record<string, unknown>,
    context?: string,
  ): void {
    this.logger.error(message, { context, trace, ...meta });
  }

  /**
   * Warn with additional metadata
   */
  warnWithMeta(
    message: string,
    meta?: Record<string, unknown>,
    context?: string,
  ): void {
    this.logger.warn(message, { context, ...meta });
  }

  /**
   * Debug with additional metadata
   */
  debugWithMeta(
    message: string,
    meta?: Record<string, unknown>,
    context?: string,
  ): void {
    this.logger.debug(message, { context, ...meta });
  }

  /**
   * HTTP request logging
   */
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    meta?: Record<string, unknown>,
  ): void {
    this.logger.info('HTTP Request', {
      context: 'HTTP',
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      ...meta,
    });
  }
}
