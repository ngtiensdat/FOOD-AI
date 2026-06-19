import { ConsoleLogger, Injectable } from '@nestjs/common';

@Injectable()
export class StructuredLogger extends ConsoleLogger {
  private formatLog(
    level: string,
    message: unknown,
    context?: string,
    trace?: string,
  ) {
    const isProduction = process.env.NODE_ENV === 'production';
    const timestamp = new Date().toISOString();
    const finalContext = context || this.context || 'Application';

    let messageStr = '';
    if (typeof message === 'string') {
      messageStr = message;
    } else if (message instanceof Error) {
      messageStr = message.message;
    } else if (typeof message === 'object' && message !== null) {
      messageStr = JSON.stringify(message);
    } else {
      messageStr = String(message);
    }

    if (isProduction) {
      const logObject = {
        timestamp,
        level,
        context: finalContext,
        message: typeof message === 'object' ? message : messageStr,
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
      return `${color}${timestamp} [${level.toUpperCase()}] ${contextStr}${messageStr}${traceStr}`;
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

  log(message: unknown, context?: string) {
    console.log(this.formatLog('log', message, context));
  }

  error(message: unknown, stack?: string, context?: string) {
    console.error(this.formatLog('error', message, context, stack));
  }

  warn(message: unknown, context?: string) {
    console.warn(this.formatLog('warn', message, context));
  }

  debug(message: unknown, context?: string) {
    console.log(this.formatLog('debug', message, context));
  }

  verbose(message: unknown, context?: string) {
    console.log(this.formatLog('verbose', message, context));
  }
}
