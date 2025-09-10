/**
 * Simple logger utility for consistent logging across the application
 * Provides debug, info, warn, and error logging with conditional output
 */

const isDevelopment = process.env.NODE_ENV === 'development';

class Logger {
  constructor(enabled = isDevelopment) {
    this.enabled = enabled;
  }

  debug(...args) {
    if (this.enabled) {
      console.log('[DEBUG]', ...args);
    }
  }

  info(...args) {
    if (this.enabled) {
      console.info('[INFO]', ...args);
    }
  }

  warn(...args) {
    console.warn('[WARN]', ...args);
  }

  error(...args) {
    console.error('[ERROR]', ...args);
  }
}

// Export a singleton instance
export const logger = new Logger();

// Also export the class for testing or custom instances
export default Logger;