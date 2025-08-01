import { toast } from '@/hooks/use-toast';

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}

export class ApiErrorHandler {
  static handle(error: unknown, context?: string): ApiError {
    const apiError = this.normalizeError(error);
    
    // Log error for development/debugging
    if (process.env.NODE_ENV === 'development') {
      console.error(`API Error${context ? ` in ${context}` : ''}:`, apiError);
    }

    // Show user-friendly error message
    this.showUserError(apiError, context);

    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.logToMonitoring(apiError, context);
    }

    return apiError;
  }

  private static normalizeError(error: unknown): ApiError {
    if (error instanceof Error) {
      const apiError = error as ApiError;
      
      // Handle Supabase errors
      if ('code' in error && 'details' in error) {
        apiError.code = (error as any).code;
        apiError.details = (error as any).details;
      }

      // Handle fetch errors
      if ('status' in error) {
        apiError.status = (error as any).status;
      }

      return apiError;
    }

    // Handle string errors
    if (typeof error === 'string') {
      return new Error(error) as ApiError;
    }

    // Handle unknown errors
    return new Error('An unexpected error occurred') as ApiError;
  }

  private static showUserError(error: ApiError, context?: string) {
    let title = 'Error';
    let description = error.message;

    // Customize messages based on error type and context
    if (error.status) {
      switch (error.status) {
        case 401:
          title = 'Authentication Required';
          description = 'Please log in to continue.';
          break;
        case 403:
          title = 'Access Denied';
          description = 'You don\'t have permission to perform this action.';
          break;
        case 404:
          title = 'Not Found';
          description = context 
            ? `The requested ${context.toLowerCase()} was not found.`
            : 'The requested resource was not found.';
          break;
        case 429:
          title = 'Too Many Requests';
          description = 'Please wait a moment before trying again.';
          break;
        case 500:
          title = 'Server Error';
          description = 'Something went wrong on our end. Please try again later.';
          break;
        default:
          title = 'Request Failed';
          break;
      }
    }

    // Handle specific Supabase error codes
    if (error.code) {
      switch (error.code) {
        case 'PGRST116':
          title = 'No Data Found';
          description = 'No records match your request.';
          break;
        case 'PGRST301':
          title = 'Database Error';
          description = 'There was a problem processing your request.';
          break;
        case '42501':
          title = 'Permission Denied';
          description = 'You don\'t have permission to access this data.';
          break;
        default:
          if (process.env.NODE_ENV === 'development') {
            description = `${error.message} (Code: ${error.code})`;
          }
          break;
      }
    }

    // Show toast notification
    toast({
      title,
      description,
      variant: 'destructive',
    });
  }

  private static logToMonitoring(error: ApiError, context?: string) {
    try {
      const errorData = {
        message: error.message,
        status: error.status,
        code: error.code,
        context,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // Log to console for now, replace with actual monitoring service
      console.error('Error logged to monitoring:', errorData);

      // Example: Send to monitoring service
      // fetch('/api/log-error', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData),
      // }).catch(console.error);
    } catch (loggingError) {
      console.error('Failed to log error to monitoring:', loggingError);
    }
  }

  static isNetworkError(error: ApiError): boolean {
    return error.message.includes('fetch') || 
           error.message.includes('network') ||
           !navigator.onLine;
  }

  static isAuthError(error: ApiError): boolean {
    return error.status === 401 || error.status === 403;
  }

  static isServerError(error: ApiError): boolean {
    return error.status ? error.status >= 500 : false;
  }

  static shouldRetry(error: ApiError): boolean {
    return this.isNetworkError(error) || 
           this.isServerError(error) ||
           error.status === 429; // Rate limited
  }
}

// Utility function for async error handling
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    ApiErrorHandler.handle(error, context);
    return null;
  }
};

// Custom hook for error handling in components
export const useApiErrorHandler = () => {
  return {
    handleError: (error: unknown, context?: string) => 
      ApiErrorHandler.handle(error, context),
    withErrorHandling,
  };
};