/**
 * Environment Configuration
 * 
 * Centralized configuration management with environment-based settings.
 * All environment variables should be accessed through this module.
 */

// ============ Environment Detection ============

export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
export const appEnv = import.meta.env.VITE_APP_ENV || 'development';

// ============ Application Config ============

export const appConfig = {
  name: import.meta.env.VITE_APP_NAME || 'POLVAK Bağış Sistemi',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  env: appEnv
} as const;

// ============ Security Config ============

export const securityConfig = {
  // PIN codes from environment (with fallbacks for development only)
  operatorPin: import.meta.env.VITE_OPERATOR_PIN || (isDevelopment ? '1234' : ''),
  adminPin: import.meta.env.VITE_ADMIN_PIN || (isDevelopment ? '123456' : ''),
  
  // CSRF
  csrfSecret: import.meta.env.VITE_CSRF_SECRET || 'default-dev-secret',
  
  // Session
  sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '30', 10) * 60 * 1000, // Convert to ms
  
  // Rate limiting
  maxLoginAttempts: parseInt(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS || '5', 10),
  lockoutDuration: parseInt(import.meta.env.VITE_LOCKOUT_DURATION || '15', 10) * 60 * 1000, // Convert to ms
} as const;

// ============ Logging Config ============

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export const loggingConfig = {
  enabled: import.meta.env.VITE_ENABLE_ERROR_LOGGING === 'true',
  level: (import.meta.env.VITE_LOG_LEVEL || 'info') as LogLevel,
} as const;

// ============ Feature Flags ============

export const features = {
  enableOfflineMode: true,
  enablePinChange: true,
  enableDetailedErrors: isDevelopment,
  enableDebugMode: isDevelopment,
} as const;

// ============ Validation ============

/**
 * Validate required environment variables in production
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (isProduction) {
    if (!import.meta.env.VITE_OPERATOR_PIN) {
      errors.push('VITE_OPERATOR_PIN is required in production');
    }
    if (!import.meta.env.VITE_ADMIN_PIN) {
      errors.push('VITE_ADMIN_PIN is required in production');
    }
    if (import.meta.env.VITE_CSRF_SECRET === 'default-dev-secret') {
      errors.push('VITE_CSRF_SECRET must be changed in production');
    }
    if (securityConfig.operatorPin === '1234') {
      errors.push('Default operator PIN detected in production - security risk!');
    }
    if (securityConfig.adminPin === '123456') {
      errors.push('Default admin PIN detected in production - security risk!');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Warn in console if config is invalid
if (isProduction) {
  const validation = validateConfig();
  if (!validation.valid) {
    console.error('⚠️ Configuration errors detected:', validation.errors);
  }
}
