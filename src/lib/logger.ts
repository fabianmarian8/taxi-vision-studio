/**
 * Axiom Logger Utility
 *
 * Provides structured logging for API routes and server components.
 * In production, logs are sent to Axiom. In development, logs go to console.
 *
 * Usage:
 * ```ts
 * import { logger } from '@/lib/logger';
 *
 * logger.info('User logged in', { userId: '123', method: 'email' });
 * logger.error('Payment failed', { error: err.message, customerId: 'cus_xxx' });
 * ```
 */

import { Logger } from 'next-axiom';

// Create a singleton logger instance
let loggerInstance: Logger | null = null;

function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger();
  }
  return loggerInstance;
}

// Log levels with structured data
type LogData = Record<string, unknown>;

/**
 * Structured logger with consistent format
 */
export const logger = {
  /**
   * Debug level - detailed information for debugging
   */
  debug: (message: string, data?: LogData) => {
    const log = getLogger();
    log.debug(message, data);
  },

  /**
   * Info level - general operational information
   */
  info: (message: string, data?: LogData) => {
    const log = getLogger();
    log.info(message, data);
  },

  /**
   * Warn level - potential issues that aren't errors
   */
  warn: (message: string, data?: LogData) => {
    const log = getLogger();
    log.warn(message, data);
  },

  /**
   * Error level - errors that need attention
   */
  error: (message: string, data?: LogData) => {
    const log = getLogger();
    log.error(message, data);
  },

  /**
   * Create a child logger with preset fields
   * Useful for request-scoped logging
   */
  with: (fields: LogData) => {
    const log = getLogger().with(fields);
    return {
      debug: (message: string, data?: LogData) => log.debug(message, data),
      info: (message: string, data?: LogData) => log.info(message, data),
      warn: (message: string, data?: LogData) => log.warn(message, data),
      error: (message: string, data?: LogData) => log.error(message, data),
    };
  },

  /**
   * Flush logs - call this at the end of serverless function
   * Important: In Vercel, logs are batched and need to be flushed
   */
  flush: async () => {
    const log = getLogger();
    await log.flush();
  },
};

/**
 * Create a request-scoped logger with common fields
 */
export function createRequestLogger(req: Request) {
  const url = new URL(req.url);
  return logger.with({
    method: req.method,
    path: url.pathname,
    userAgent: req.headers.get('user-agent') || 'unknown',
  });
}

/**
 * Log API response with timing
 */
export async function logApiResponse(
  requestLogger: ReturnType<typeof logger.with>,
  status: number,
  startTime: number,
  extra?: LogData
) {
  const duration = Date.now() - startTime;
  const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

  requestLogger[level]('API response', {
    status,
    duration,
    ...extra,
  });

  // Flush logs at end of request
  await logger.flush();
}

export default logger;
