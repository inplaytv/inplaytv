/**
 * Production-safe logging utility
 * Logs are only visible in development mode
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Debug logs - only shown in development
   */
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Warning logs - only shown in development
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Error logs - ALWAYS shown (important for production monitoring)
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * Info logs - only shown in development
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
};
