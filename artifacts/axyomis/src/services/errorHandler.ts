/**
 * Global Error Handling & Recovery System
 * Prevents crashes and provides graceful degradation
 */

// Error logging service
export class ErrorLogger {
  private static isDevelopment = import.meta.env.DEV;
  private static errorQueue: Array<{ error: Error; context: string; timestamp: number }> = [];

  static log(error: Error, context: string = 'Unknown') {
    const entry = { error, context, timestamp: Date.now() };
    this.errorQueue.push(entry);

    // Keep only last 50 errors
    if (this.errorQueue.length > 50) {
      this.errorQueue.shift();
    }

    if (this.isDevelopment) {
      console.error(`[${context}]`, error);
    }

    // Send to error tracking service (e.g., Sentry)
    this.reportToService(entry);
  }

  static getErrors() {
    return this.errorQueue;
  }

  static clearErrors() {
    this.errorQueue = [];
  }

  private static async reportToService(entry: { error: Error; context: string; timestamp: number }) {
    // TODO: Integrate with Sentry or similar service
    try {
      // await fetch('/api/error-report', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry),
      // });
    } catch (e) {
      // Silently fail to avoid recursive errors
    }
  }
}

// Error types
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public severity: 'low' | 'medium' | 'high' | 'critical',
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Common error codes
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  TIMEOUT: 'TIMEOUT',

  // Auth errors
  AUTH_FAILED: 'AUTH_FAILED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Data errors
  DATA_LOAD_ERROR: 'DATA_LOAD_ERROR',
  DATA_PARSE_ERROR: 'DATA_PARSE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Component errors
  RENDER_ERROR: 'RENDER_ERROR',
  HOOK_ERROR: 'HOOK_ERROR',

  // Resource errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',

  // Video errors
  VIDEO_NOT_AVAILABLE: 'VIDEO_NOT_AVAILABLE',
  VIDEO_LOAD_ERROR: 'VIDEO_LOAD_ERROR',
};

/**
 * Safe API call wrapper with retry logic
 */
export async function safeApiCall<T>(
  fn: () => Promise<T>,
  context: string,
  options: { retries: number; timeout: number } = { retries: 2, timeout: 10000 }
): Promise<{ success: boolean; data?: T; error?: Error }> {
  const startTime = Date.now();

  for (let attempt = 0; attempt <= options.retries; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new AppError(ERROR_CODES.TIMEOUT, 'API call timeout', 'medium', true)),
          options.timeout
        )
      );

      const result = await Promise.race([fn(), timeoutPromise]);

      return { success: true, data: result };
    } catch (error: any) {
      const elapsed = Date.now() - startTime;
      const isLastAttempt = attempt === options.retries;

      ErrorLogger.log(
        error instanceof Error ? error : new Error(String(error)),
        `${context} (attempt ${attempt + 1}/${options.retries + 1}, ${elapsed}ms)`
      );

      if (isLastAttempt) {
        return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
      }

      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return { success: false, error: new Error('Unknown error') };
}

/**
 * Local storage with error handling
 */
export const SafeStorage = {
  getItem<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : (defaultValue || null);
    } catch (error) {
      ErrorLogger.log(error as Error, `SafeStorage.getItem(${key})`);
      return defaultValue || null;
    }
  },

  setItem<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      ErrorLogger.log(error as Error, `SafeStorage.setItem(${key})`);
      return false;
    }
  },

  removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      ErrorLogger.log(error as Error, `SafeStorage.removeItem(${key})`);
      return false;
    }
  },

  clear(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      ErrorLogger.log(error as Error, 'SafeStorage.clear()');
      return false;
    }
  },
};

/**
 * Global unhandled error handler
 */
export function setupGlobalErrorHandling() {
  window.addEventListener('unhandledrejection', (event) => {
    ErrorLogger.log(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      'Unhandled Promise Rejection'
    );
  });

  window.addEventListener('error', (event) => {
    if (event.message.includes('Script error')) {
      return;
    }
    ErrorLogger.log(event.error || new Error(event.message), 'Global Error Handler');
  });
}

/**
 * Retry decorator
 */
export function retry(maxAttempts: number = 3, delay: number = 1000) {
  return function decorator(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          if (attempt === maxAttempts - 1) throw error;
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
        }
      }
    };

    return descriptor;
  };
}
