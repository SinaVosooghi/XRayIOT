/**
 * Environment-Specific Configuration
 *
 * This file provides environment-specific configuration defaults
 * and validation rules for different deployment environments.
 */

export interface EnvironmentConfig {
  nodeEnv: 'development' | 'test' | 'production';
  features: {
    enableMetrics: boolean;
    enableTracing: boolean;
    enableValidation: boolean;
    enableRateLimiting: boolean;
    enableCors: boolean;
    enableSwagger: boolean;
  };
  security: {
    requireApiKey: boolean;
    requireHmacSecret: boolean;
    minHmacSecretLength: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
    enableFile: boolean;
  };
}

export const environmentConfigs: Record<string, EnvironmentConfig> = {
  development: {
    nodeEnv: 'development',
    features: {
      enableMetrics: true,
      enableTracing: false,
      enableValidation: true,
      enableRateLimiting: false, // Disabled in dev for easier testing
      enableCors: true,
      enableSwagger: true,
    },
    security: {
      requireApiKey: false,
      requireHmacSecret: false,
      minHmacSecretLength: 16,
    },
    logging: {
      level: 'debug',
      enableConsole: true,
      enableFile: false,
    },
  },
  test: {
    nodeEnv: 'test',
    features: {
      enableMetrics: false, // Disabled in tests for performance
      enableTracing: false,
      enableValidation: true,
      enableRateLimiting: false, // Disabled in tests
      enableCors: true,
      enableSwagger: false, // Disabled in tests
    },
    security: {
      requireApiKey: false,
      requireHmacSecret: false,
      minHmacSecretLength: 8, // Shorter for tests
    },
    logging: {
      level: 'error', // Minimal logging in tests
      enableConsole: false,
      enableFile: false,
    },
  },
  production: {
    nodeEnv: 'production',
    features: {
      enableMetrics: true,
      enableTracing: true,
      enableValidation: true,
      enableRateLimiting: true,
      enableCors: true,
      enableSwagger: false, // Disabled in production
    },
    security: {
      requireApiKey: true,
      requireHmacSecret: true,
      minHmacSecretLength: 32, // Stronger in production
    },
    logging: {
      level: 'info',
      enableConsole: true,
      enableFile: true,
    },
  },
};

export function getEnvironmentConfig(env: string): EnvironmentConfig {
  return environmentConfigs[env] || environmentConfigs.development;
}

export function validateEnvironmentConfig(config: EnvironmentConfig): void {
  const { nodeEnv, features, security, logging } = config;

  // Validate node environment
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error(`Invalid NODE_ENV: ${nodeEnv}. Must be one of: development, test, production`);
  }

  // Validate features
  if (typeof features.enableMetrics !== 'boolean') {
    throw new Error('features.enableMetrics must be a boolean');
  }

  // Validate security requirements based on environment
  if (nodeEnv === 'production') {
    if (security.requireApiKey && !process.env.API_KEY) {
      throw new Error('API_KEY is required in production environment');
    }
    if (
      security.requireHmacSecret &&
      (!process.env.HMAC_SECRET_KEY ||
        process.env.HMAC_SECRET_KEY.length < security.minHmacSecretLength)
    ) {
      throw new Error(
        `HMAC_SECRET_KEY is required in production and must be at least ${security.minHmacSecretLength} characters`
      );
    }
  }

  // Validate logging level
  if (!['debug', 'info', 'warn', 'error'].includes(logging.level)) {
    throw new Error(
      `Invalid log level: ${logging.level}. Must be one of: debug, info, warn, error`
    );
  }
}
