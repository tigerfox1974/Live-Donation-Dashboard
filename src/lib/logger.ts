/**
 * Logging Module
 * 
 * Provides structured logging with different levels and
 * optional remote error reporting for production.
 */

import { loggingConfig, isDevelopment, isProduction, appConfig } from './config';

// ============ Types ============

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
  stack?: string;
  userAgent?: string;
  url?: string;
  appVersion?: string;
}

interface ErrorLogEntry extends LogEntry {
  errorName?: string;
  errorMessage?: string;
  componentStack?: string;
}

// ============ Log Level Priority ============

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// ============ Local Storage for Error Logs ============

const ERROR_LOG_KEY = 'polvak_error_logs';
const MAX_STORED_ERRORS = 50;

function getStoredErrors(): ErrorLogEntry[] {
  try {
    const stored = localStorage.getItem(ERROR_LOG_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function storeError(entry: ErrorLogEntry): void {
  try {
    const errors = getStoredErrors();
    errors.unshift(entry);
    
    // Keep only last N errors
    const trimmed = errors.slice(0, MAX_STORED_ERRORS);
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore storage errors
  }
}

// ============ Logger Class ============

class Logger {
  private minLevel: number;
  
  constructor() {
    this.minLevel = LOG_LEVELS[loggingConfig.level];
  }
  
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= this.minLevel;
  }
  
  private formatMessage(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      url: window.location.href,
      userAgent: navigator.userAgent,
      appVersion: appConfig.version
    };
  }
  
  private output(level: LogLevel, entry: LogEntry): void {
    if (!this.shouldLog(level)) return;
    
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;
    
    switch (level) {
      case 'debug':
        if (isDevelopment) {
          console.debug(prefix, entry.message, entry.data ?? '');
        }
        break;
      case 'info':
        console.info(prefix, entry.message, entry.data ?? '');
        break;
      case 'warn':
        console.warn(prefix, entry.message, entry.data ?? '');
        break;
      case 'error':
        console.error(prefix, entry.message, entry.data ?? '');
        break;
    }
  }
  
  debug(message: string, data?: unknown): void {
    const entry = this.formatMessage('debug', message, data);
    this.output('debug', entry);
  }
  
  info(message: string, data?: unknown): void {
    const entry = this.formatMessage('info', message, data);
    this.output('info', entry);
  }
  
  warn(message: string, data?: unknown): void {
    const entry = this.formatMessage('warn', message, data);
    this.output('warn', entry);
  }
  
  error(message: string, error?: Error | unknown, componentStack?: string): void {
    const entry: ErrorLogEntry = {
      ...this.formatMessage('error', message),
      componentStack
    };
    
    if (error instanceof Error) {
      entry.errorName = error.name;
      entry.errorMessage = error.message;
      entry.stack = error.stack;
      entry.data = { originalError: error.toString() };
    } else if (error) {
      entry.data = error;
    }
    
    this.output('error', entry);
    
    // Store error for later retrieval in production
    if (isProduction && loggingConfig.enabled) {
      storeError(entry);
      
      // In a real app, you would send this to a logging service
      // this.sendToRemote(entry);
    }
  }
  
  /**
   * Log an error from React Error Boundary
   */
  logErrorBoundary(error: Error, componentStack: string): void {
    this.error('React Error Boundary caught an error', error, componentStack);
  }
  
  /**
   * Log unhandled promise rejection
   */
  logUnhandledRejection(reason: unknown): void {
    this.error('Unhandled Promise Rejection', reason);
  }
  
  /**
   * Log global error
   */
  logGlobalError(message: string, source?: string, lineno?: number, colno?: number, error?: Error): void {
    this.error(`Global Error: ${message}`, {
      source,
      lineno,
      colno,
      error: error?.stack || error?.message
    });
  }
  
  /**
   * Get stored error logs (for debugging/export)
   */
  getStoredErrors(): ErrorLogEntry[] {
    return getStoredErrors();
  }
  
  /**
   * Clear stored error logs
   */
  clearStoredErrors(): void {
    localStorage.removeItem(ERROR_LOG_KEY);
  }
  
  /**
   * Export error logs as JSON
   */
  exportErrors(): string {
    return JSON.stringify(getStoredErrors(), null, 2);
  }
}

// ============ Singleton Instance ============

export const logger = new Logger();

// ============ Global Error Handlers ============

/**
 * Setup global error handlers
 */
export function setupGlobalErrorHandlers(): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.logUnhandledRejection(event.reason);
  });
  
  // Handle global errors
  window.onerror = (message, source, lineno, colno, error) => {
    logger.logGlobalError(
      typeof message === 'string' ? message : 'Unknown error',
      source,
      lineno,
      colno,
      error
    );
    return false; // Let the default handler run too
  };
  
  logger.info('Global error handlers initialized');
}
