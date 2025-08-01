// Production Configuration for Talo Yoga CRM
// Centralized configuration management with environment validation

interface Config {
  app: {
    name: string;
    version: string;
    environment: 'development' | 'production' | 'staging';
  };
  supabase: {
    url: string;
    anonKey: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
  features: {
    enableAuditLogging: boolean;
    enableRateLimiting: boolean;
    enableOfflineMode: boolean;
  };
  security: {
    allowedOrigins: string[];
    csrfProtection: boolean;
  };
}

// Environment variable validation
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const;

function validateEnvironment(): void {
  const missing = requiredEnvVars.filter(
    (envVar) => !import.meta.env[envVar]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

// Validate environment on module load
validateEnvironment();

export const config: Config = {
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Talo Yoga CRM',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: (import.meta.env.MODE as Config['app']['environment']) || 'development',
  },
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL!,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
  },
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_SUPABASE_URL!,
    timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000, // 30 seconds
    retryAttempts: Number(import.meta.env.VITE_API_RETRY_ATTEMPTS) || 3,
    retryDelay: Number(import.meta.env.VITE_API_RETRY_DELAY) || 1000, // 1 second
  },
  features: {
    enableAuditLogging: import.meta.env.VITE_ENABLE_AUDIT_LOGGING === 'true',
    enableRateLimiting: import.meta.env.VITE_ENABLE_RATE_LIMITING === 'true',
    enableOfflineMode: import.meta.env.VITE_ENABLE_OFFLINE_MODE === 'true',
  },
  security: {
    allowedOrigins: import.meta.env.VITE_ALLOWED_ORIGINS?.split(',') || [
      'https://lovable.dev',
      'http://localhost:8080',
    ],
    csrfProtection: import.meta.env.VITE_CSRF_PROTECTION === 'true',
  },
};

// Production environment checks
export const isProduction = config.app.environment === 'production';
export const isDevelopment = config.app.environment === 'development';
export const isStaging = config.app.environment === 'staging';

// Feature flags
export const features = {
  canAccessAdminFeatures: () => {
    // In production, check user roles properly
    return isDevelopment || isStaging;
  },
  canDeleteCustomers: () => {
    // Only allow in development or for admin users
    return isDevelopment;
  },
  canAccessAuditLogs: () => {
    return config.features.enableAuditLogging;
  },
};

// Logging configuration
export const logger = {
  level: isProduction ? 'error' : 'debug',
  enableConsole: !isProduction,
  enableRemote: isProduction,
};

// Performance monitoring
export const performance = {
  enableMetrics: isProduction,
  sampleRate: isProduction ? 0.1 : 1.0, // 10% sampling in production
};

// Error reporting
export const errorReporting = {
  enabled: isProduction,
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: config.app.environment,
  release: config.app.version,
};

// Default export for easy importing
export default config;