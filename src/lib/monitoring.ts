// Production Monitoring and Performance Tracking
import React from 'react';
import { config } from './config';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface ErrorMetric {
  message: string;
  stack?: string;
  component?: string;
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
}

class MonitoringService {
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorMetric[] = [];
  private batchSize = 10;
  private flushInterval = 30000; // 30 seconds

  constructor() {
    if (config.features.enableAuditLogging) {
      this.initializePerformanceObserver();
      this.startBatchFlush();
    }
  }

  // Performance monitoring
  trackPerformance(name: string, value: number, metadata?: Record<string, unknown>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);
    
    if (config.app.environment === 'development') {
      console.log(`📊 Performance: ${name} = ${value}ms`, metadata);
    }

    if (this.metrics.length >= this.batchSize) {
      this.flushMetrics();
    }
  }

  // Error tracking
  trackError(error: Error | string, component?: string, metadata?: Record<string, unknown>) {
    const errorMetric: ErrorMetric = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      component,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
    };

    this.errors.push(errorMetric);

    if (config.app.environment === 'development') {
      console.error('🚨 Error tracked:', errorMetric);
    }

    if (this.errors.length >= this.batchSize) {
      this.flushErrors();
    }
  }

  // User interaction tracking
  trackUserAction(action: string, details?: Record<string, unknown>) {
    this.trackPerformance(`user_action.${action}`, Date.now(), details);
  }

  // API call tracking
  trackApiCall(endpoint: string, method: string, duration: number, status: number) {
    this.trackPerformance('api_call', duration, {
      endpoint,
      method,
      status,
      success: status >= 200 && status < 300,
    });
  }

  // Component render tracking
  trackComponentRender(componentName: string, renderTime: number) {
    this.trackPerformance('component_render', renderTime, {
      component: componentName,
    });
  }

  // Database query tracking
  trackDatabaseQuery(table: string, operation: string, duration: number) {
    this.trackPerformance('database_query', duration, {
      table,
      operation,
    });
  }

  private initializePerformanceObserver() {
    // Web Vitals tracking
    if (typeof PerformanceObserver !== 'undefined') {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.trackPerformance('lcp', lastEntry.startTime);
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.trackPerformance('fid', (entry as any).processingStart - entry.startTime);
        });
      });

      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // Cumulative Layout Shift
      let cumulativeLayoutShift = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            cumulativeLayoutShift += entry.value;
          }
        });
        this.trackPerformance('cls', cumulativeLayoutShift);
      });

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS observer not supported');
      }
    }

    // Resource timing tracking
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.trackPerformance('page_load', navigation.loadEventEnd - navigation.fetchStart);
        this.trackPerformance('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
        this.trackPerformance('first_byte', navigation.responseStart - navigation.fetchStart);
      }
    });
  }

  private startBatchFlush() {
    setInterval(() => {
      this.flushMetrics();
      this.flushErrors();
    }, this.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushMetrics();
      this.flushErrors();
    });
  }

  private async flushMetrics() {
    if (this.metrics.length === 0) return;

    const metricsToSend = [...this.metrics];
    this.metrics = [];

    try {
      await this.sendToEndpoint('/api/metrics', metricsToSend);
    } catch (error) {
      console.error('Failed to send metrics:', error);
      // Put metrics back for retry (keep only recent ones)
      this.metrics = [...metricsToSend.slice(-5), ...this.metrics];
    }
  }

  private async flushErrors() {
    if (this.errors.length === 0) return;

    const errorsToSend = [...this.errors];
    this.errors = [];

    try {
      await this.sendToEndpoint('/api/errors', errorsToSend);
    } catch (error) {
      console.error('Failed to send errors:', error);
      // Put errors back for retry (keep only recent ones)
      this.errors = [...errorsToSend.slice(-5), ...this.errors];
    }
  }

  private async sendToEndpoint(endpoint: string, data: unknown) {
    if (config.app.environment === 'development') {
      console.log(`Would send to ${endpoint}:`, data);
      return;
    }

    // In production, send to actual monitoring endpoint
    const response = await fetch(`${config.api.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to send data to ${endpoint}: ${response.statusText}`);
    }
  }

  private getCurrentUserId(): string | undefined {
    // Get current user ID from auth context or localStorage
    try {
      const user = JSON.parse(localStorage.getItem('supabase.auth.token') || '{}');
      return user?.user?.id;
    } catch {
      return undefined;
    }
  }

  // Health check endpoint
  async checkHealth(): Promise<{ status: 'healthy' | 'unhealthy'; details: Record<string, unknown> }> {
    try {
      const start = performance.now();
      
      // Check API connectivity
      const response = await fetch(`${config.supabase.url}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': config.supabase.anonKey,
        },
      });

      const apiResponseTime = performance.now() - start;
      
      const details = {
        api_response_time: apiResponseTime,
        api_status: response.status,
        timestamp: Date.now(),
        user_agent: navigator.userAgent,
        online: navigator.onLine,
        connection: (navigator as any).connection?.effectiveType || 'unknown',
      };

      const isHealthy = response.ok && apiResponseTime < 5000; // 5 second threshold

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
        },
      };
    }
  }
}

// Singleton instance
export const monitoring = new MonitoringService();

// Performance timing utilities
export const withPerformanceTracking = <T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T => {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    const result = fn(...args);
    
    if (result instanceof Promise) {
      return result.finally(() => {
        monitoring.trackPerformance(name, performance.now() - start);
      });
    } else {
      monitoring.trackPerformance(name, performance.now() - start);
      return result;
    }
  }) as T;
};

// React component performance tracker
export const withComponentTracking = (componentName: string) => {
  return <P extends object>(Component: React.ComponentType<P>) => {
    return (props: P) => {
      const start = performance.now();
      
      React.useEffect(() => {
        monitoring.trackComponentRender(componentName, performance.now() - start);
      });

      return React.createElement(Component, props);
    };
  };
};

// API call tracker
export const trackApiCall = async <T>(
  apiCall: () => Promise<T>,
  endpoint: string,
  method: string = 'GET'
): Promise<T> => {
  const start = performance.now();
  let status = 0;
  
  try {
    const result = await apiCall();
    status = 200; // Assume success if no error
    return result;
  } catch (error) {
    status = error instanceof Error && 'status' in error ? (error as any).status : 500;
    throw error;
  } finally {
    monitoring.trackApiCall(endpoint, method, performance.now() - start, status);
  }
};