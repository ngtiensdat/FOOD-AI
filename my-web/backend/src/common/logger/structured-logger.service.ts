import { ConsoleLogger, Injectable } from '@nestjs/common';

@Injectable()
export class StructuredLogger extends ConsoleLogger {
  private formatLog(
    level: string,
    message: any,
    context?: string,
    trace?: string,
  ) {
    const isProduction = process.env.NODE_ENV === 'production';
    const timestamp = new Date().toISOString();
    const finalContext = context || this.context || 'Application';

    if (isProduction) {
      const logObject = {
        timestamp,
        level,
        context: finalContext,
        message: typeof message === 'object' ? message : String(message),
        ...(trace ? { trace } : {}),
      };
      return JSON.stringify(logObject);
    } else {
      // In development, print readable colored text
      const contextStr = finalContext
        ? `\x1b[36m[${finalContext}]\x1b[0m `
        : '';
      const traceStr = trace ? `\n\x1b[31m${trace}\x1b[0m` : '';
      const color = this.getColor(level);
      return `${color}${timestamp} [${level.toUpperCase()}] ${contextStr}${String(message)}${traceStr}`;
    }
  }

  private getColor(level: string): string {
    switch (level) {
      case 'error':
        return '\x1b[31m'; // Red
      case 'warn':
        return '\x1b[33m'; // Yellow
      case 'log':
        return '\x1b[32m'; // Green
      case 'debug':
        return '\x1b[35m'; // Magenta
      case 'verbose':
        return '\x1b[36m'; // Cyan
      default:
        return '\x1b[0m';
    }
  }

  log(message: any, context?: string) {
    console.log(this.formatLog('log', message, context));
  }

  error(message: any, stack?: string, context?: string) {
    console.error(this.formatLog('error', message, context, stack));
  }

  warn(message: any, context?: string) {
    console.warn(this.formatLog('warn', message, context));
  }

  debug(message: any, context?: string) {
    console.log(this.formatLog('debug', message, context));
  }

  verbose(message: any, context?: string) {
    console.log(this.formatLog('verbose', message, context));
  }
}
