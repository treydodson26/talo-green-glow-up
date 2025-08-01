import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiErrorHandler, withErrorHandling } from './api-error-handler';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('ApiErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handle', () => {
    it('handles Error objects', () => {
      const error = new Error('Test error');
      const result = ApiErrorHandler.handle(error);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Test error');
    });

    it('handles string errors', () => {
      const result = ApiErrorHandler.handle('String error');

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('String error');
    });

    it('handles unknown errors', () => {
      const result = ApiErrorHandler.handle({ unknown: 'object' });

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('An unexpected error occurred');
    });

    it('handles Supabase errors with code', () => {
      const supabaseError = {
        message: 'Permission denied',
        code: '42501',
        details: 'User lacks privilege',
      };

      const result = ApiErrorHandler.handle(supabaseError);

      expect(result.code).toBe('42501');
      expect(result.details).toBe('User lacks privilege');
    });

    it('handles HTTP status codes', () => {
      const httpError = new Error('Not found');
      (httpError as any).status = 404;

      const result = ApiErrorHandler.handle(httpError);

      expect(result.status).toBe(404);
    });
  });

  describe('isNetworkError', () => {
    it('identifies network errors', () => {
      const networkError = new Error('fetch failed');
      expect(ApiErrorHandler.isNetworkError(networkError as any)).toBe(true);

      const normalError = new Error('validation failed');
      expect(ApiErrorHandler.isNetworkError(normalError as any)).toBe(false);
    });
  });

  describe('isAuthError', () => {
    it('identifies auth errors', () => {
      const authError = new Error('Unauthorized');
      (authError as any).status = 401;
      expect(ApiErrorHandler.isAuthError(authError as any)).toBe(true);

      const forbiddenError = new Error('Forbidden');
      (forbiddenError as any).status = 403;
      expect(ApiErrorHandler.isAuthError(forbiddenError as any)).toBe(true);

      const normalError = new Error('Bad request');
      (normalError as any).status = 400;
      expect(ApiErrorHandler.isAuthError(normalError as any)).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('identifies server errors', () => {
      const serverError = new Error('Internal server error');
      (serverError as any).status = 500;
      expect(ApiErrorHandler.isServerError(serverError as any)).toBe(true);

      const clientError = new Error('Bad request');
      (clientError as any).status = 400;
      expect(ApiErrorHandler.isServerError(clientError as any)).toBe(false);
    });
  });

  describe('shouldRetry', () => {
    it('suggests retry for network errors', () => {
      const networkError = new Error('fetch failed');
      expect(ApiErrorHandler.shouldRetry(networkError as any)).toBe(true);
    });

    it('suggests retry for server errors', () => {
      const serverError = new Error('Internal server error');
      (serverError as any).status = 500;
      expect(ApiErrorHandler.shouldRetry(serverError as any)).toBe(true);
    });

    it('suggests retry for rate limit errors', () => {
      const rateLimitError = new Error('Too many requests');
      (rateLimitError as any).status = 429;
      expect(ApiErrorHandler.shouldRetry(rateLimitError as any)).toBe(true);
    });

    it('does not suggest retry for client errors', () => {
      const clientError = new Error('Bad request');
      (clientError as any).status = 400;
      expect(ApiErrorHandler.shouldRetry(clientError as any)).toBe(false);
    });
  });
});

describe('withErrorHandling', () => {
  it('returns result when operation succeeds', async () => {
    const successfulOperation = () => Promise.resolve('success');
    
    const result = await withErrorHandling(successfulOperation, 'test context');
    
    expect(result).toBe('success');
  });

  it('returns null when operation fails', async () => {
    const failingOperation = () => Promise.reject(new Error('Operation failed'));
    
    const result = await withErrorHandling(failingOperation, 'test context');
    
    expect(result).toBeNull();
  });

  it('handles errors with context', async () => {
    const spy = vi.spyOn(ApiErrorHandler, 'handle');
    const failingOperation = () => Promise.reject(new Error('Operation failed'));
    
    await withErrorHandling(failingOperation, 'test context');
    
    expect(spy).toHaveBeenCalledWith(
      expect.any(Error),
      'test context'
    );
  });
});