import { ConsoleLogger, Injectable, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggerService extends ConsoleLogger {
  private readonly isDevelopment: boolean;

  constructor(private readonly configService: ConfigService) {
    super();
    this.isDevelopment =
      this.configService.get<string>('NODE_ENV') !== 'production';
    this.setLogLevels(this.getLogLevels());
  }

  private getLogLevels(): LogLevel[] {
    if (this.isDevelopment) {
      return ['log', 'error', 'warn', 'debug', 'verbose'];
    }
    return ['log', 'error', 'warn'];
  }

  /**
   * Log with additional context and metadata
   */
  logWithMeta(
    message: string,
    meta?: Record<string, unknown>,
    context?: string,
  ): void {
    const formattedMessage = meta
      ? `${message} | ${JSON.stringify(meta)}`
      : message;
    super.log(formattedMessage, context || this.context);
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
    const formattedMessage = meta
      ? `${message} | ${JSON.stringify(meta)}`
      : message;
    super.error(formattedMessage, trace, context || this.context);
  }

  /**
   * Warn with additional metadata
   */
  warnWithMeta(
    message: string,
    meta?: Record<string, unknown>,
    context?: string,
  ): void {
    const formattedMessage = meta
      ? `${message} | ${JSON.stringify(meta)}`
      : message;
    super.warn(formattedMessage, context || this.context);
  }

  /**
   * Debug with additional metadata
   */
  debugWithMeta(
    message: string,
    meta?: Record<string, unknown>,
    context?: string,
  ): void {
    const formattedMessage = meta
      ? `${message} | ${JSON.stringify(meta)}`
      : message;
    super.debug(formattedMessage, context || this.context);
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
    const logData = {
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      ...meta,
    };
    this.logWithMeta('HTTP Request', logData, 'HTTP');
  }
}
