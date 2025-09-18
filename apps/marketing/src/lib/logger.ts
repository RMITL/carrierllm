/**
 * Marketing site logging utility for debugging Clerk billing issues
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 50; // Smaller for marketing site

  private formatMessage(level: LogLevel, message: string, context?: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    return `${timestamp} ${level.toUpperCase()} ${contextStr} ${message}`;
  }

  private addLog(level: LogLevel, message: string, context?: string, data?: any): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      userId: this.getCurrentUserId(),
      sessionId: this.getCurrentSessionId(),
    };

    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Console logging with appropriate level
    const formattedMessage = this.formatMessage(level, message, context, data);
    switch (level) {
      case 'debug':
        console.debug(formattedMessage, data);
        break;
      case 'info':
        console.info(formattedMessage, data);
        break;
      case 'warn':
        console.warn(formattedMessage, data);
        break;
      case 'error':
        console.error(formattedMessage, data);
        break;
    }
  }

  private getCurrentUserId(): string | undefined {
    try {
      if (typeof window !== 'undefined' && (window as any).Clerk?.user?.id) {
        return (window as any).Clerk.user.id;
      }
    } catch (error) {
      // Ignore errors getting user ID
    }
    return undefined;
  }

  private getCurrentSessionId(): string | undefined {
    try {
      if (typeof window !== 'undefined' && (window as any).Clerk?.session?.id) {
        return (window as any).Clerk.session.id;
      }
    } catch (error) {
      // Ignore errors getting session ID
    }
    return undefined;
  }

  debug(message: string, context?: string, data?: any): void {
    this.addLog('debug', message, context, data);
  }

  info(message: string, context?: string, data?: any): void {
    this.addLog('info', message, context, data);
  }

  warn(message: string, context?: string, data?: any): void {
    this.addLog('warn', message, context, data);
  }

  error(message: string, context?: string, data?: any): void {
    this.addLog('error', message, context, data);
  }

  // Billing-specific logging methods
  billingDebug(message: string, data?: any): void {
    this.debug(message, 'billing', data);
  }

  billingInfo(message: string, data?: any): void {
    this.info(message, 'billing', data);
  }

  billingWarn(message: string, data?: any): void {
    this.warn(message, 'billing', data);
  }

  billingError(message: string, data?: any): void {
    this.error(message, 'billing', data);
  }

  // Get logs for debugging
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Create singleton instance
export const logger = new Logger();

// Make logger available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).marketingLogger = logger;
}
