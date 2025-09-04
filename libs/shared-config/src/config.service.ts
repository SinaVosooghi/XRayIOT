import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import {
  getEnvironmentConfig,
  validateEnvironmentConfig,
  EnvironmentConfig,
} from './config/environment.config';

// Configuration interfaces for better typing
export interface DatabaseConfig {
  uri: string;
  dbName: string;
  connectionTimeout: number;
  socketTimeout: number;
}

export interface RabbitMQConfig {
  uri: string;
  exchange: string;
  queue: string;
  dlx: string;
  heartbeat: number;
  prefetch: number;
  retryMax: number;
  connectionTimeout: number;
}

export interface RedisConfig {
  uri: string;
  idempTtlSec: number;
  connectionTimeout: number;
  retryAttempts: number;
}

export interface StorageConfig {
  rawStore: 'gridfs' | 'minio';
  minioEndpoint?: string;
  minioPort?: number;
  minioUseSsl: boolean;
  minioAccessKey?: string;
  minioSecretKey?: string;
  minioBucket: string;
  presignTtlSec: number;
}

export interface SecurityConfig {
  apiKey?: string;
  rateLimitRpm: number;
  corsOrigin: string;
  corsCredentials: boolean;
  bodyLimit: string;
}

export interface HmacConfig {
  secretKey: string;
  algorithm: 'sha256' | 'sha512';
  timestampTolerance: number;
  nonceLength: number;
  nonceTtl: number;
}

export interface ObservabilityConfig {
  metricsEnabled: boolean;
  otelEnabled: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  healthCheckTimeout: number;
  healthCheckInterval: number;
}

export interface ProducerConfig {
  devices: number;
  ratePerSec: number;
  mode: 'steady' | 'burst';
  burstSize: number;
}

@Injectable()
export class ConfigService implements OnModuleInit {
  private environmentConfig!: EnvironmentConfig;

  constructor(private readonly cfg: NestConfigService) {}

  onModuleInit() {
    // Initialize environment-specific configuration
    this.environmentConfig = getEnvironmentConfig(this.nodeEnv);

    // Skip validation in test environment if explicitly disabled
    if (this.nodeEnv === 'test' && process.env.SKIP_CONFIG_VALIDATION === 'true') {
      console.log('⏭️ Skipping configuration validation in test environment');
      return;
    }

    try {
      // Validate environment-specific configuration
      validateEnvironmentConfig(this.environmentConfig);

      // Validate required environment variables
      this.validateRequiredConfig();

      console.log('✅ Configuration validated successfully');
      console.log(`🌍 Environment: ${this.nodeEnv}`);
      console.log(`🚀 Port: ${this.port}`);
      console.log(`🗄️ Database: ${this.database.uri}`);
      console.log(`🐰 RabbitMQ: ${this.rabbitmq.uri}`);
      console.log(`🔴 Redis: ${this.redis.uri}`);
      console.log(`💾 Storage: ${this.storage.rawStore}`);
    } catch (error) {
      console.error('❌ Configuration validation failed:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Validate required configuration based on environment
   */
  private validateRequiredConfig(): void {
    // Always required
    if (!this.cfg.get<string>('MONGO_URI')) {
      throw new Error('MONGO_URI environment variable is required');
    }
    if (!this.cfg.get<string>('RABBITMQ_URI')) {
      throw new Error('RABBITMQ_URI environment variable is required');
    }
    if (!this.cfg.get<string>('REDIS_URI')) {
      throw new Error('REDIS_URI environment variable is required');
    }

    // Environment-specific requirements
    if (this.environmentConfig.security.requireApiKey && !this.cfg.get<string>('API_KEY')) {
      throw new Error('API_KEY environment variable is required in this environment');
    }
    if (this.environmentConfig.security.requireHmacSecret) {
      const hmacSecret = this.cfg.get<string>('HMAC_SECRET_KEY');
      if (!hmacSecret || hmacSecret.length < this.environmentConfig.security.minHmacSecretLength) {
        throw new Error(
          `HMAC_SECRET_KEY is required and must be at least ${this.environmentConfig.security.minHmacSecretLength} characters`
        );
      }
    }
  }

  // Node Environment
  get nodeEnv(): string {
    return this.cfg.get<string>('NODE_ENV') || 'development';
  }

  get port(): number {
    return this.cfg.get<number>('PORT') || 3000;
  }

  get host(): string {
    return this.cfg.get<string>('HOST') || '0.0.0.0';
  }

  // Database Configuration
  get database() {
    const uri = this.cfg.get<string>('MONGO_URI');
    if (!uri) {
      throw new Error('MONGO_URI environment variable is required');
    }

    return {
      uri,
      dbName: this.cfg.get<string>('MONGO_DB') || 'iotp',
      connectionTimeout: this.cfg.get<number>('MONGO_CONNECTION_TIMEOUT') || 30000,
      socketTimeout: this.cfg.get<number>('MONGO_SOCKET_TIMEOUT') || 45000,
    };
  }

  // RabbitMQ Configuration
  get rabbitmq() {
    const uri = this.cfg.get<string>('RABBITMQ_URI');
    if (!uri) {
      throw new Error('RABBITMQ_URI environment variable is required');
    }

    return {
      uri,
      exchange: this.cfg.get<string>('RABBITMQ_EXCHANGE') || 'iot.xray',
      queue: this.cfg.get<string>('RABBITMQ_QUEUE') || 'xray.raw.q',
      dlx: this.cfg.get<string>('RABBITMQ_DLX') || 'iot.dlx',
      heartbeat: this.cfg.get<number>('RABBITMQ_HEARTBEAT') || 30,
      prefetch: this.cfg.get<number>('RABBITMQ_PREFETCH') || 50,
      retryMax: this.cfg.get<number>('RABBITMQ_RETRY_MAX') || 3,
      connectionTimeout: this.cfg.get<number>('RABBITMQ_CONNECTION_TIMEOUT') || 5000,
    };
  }

  // Redis Configuration
  get redis() {
    const uri = this.cfg.get<string>('REDIS_URI');
    if (!uri) {
      throw new Error('REDIS_URI environment variable is required');
    }

    return {
      uri,
      idempTtlSec: this.cfg.get<number>('IDEMP_TTL_SEC') || 900,
      connectionTimeout: this.cfg.get<number>('REDIS_CONNECTION_TIMEOUT') || 5000,
      retryAttempts: this.cfg.get<number>('REDIS_RETRY_ATTEMPTS') || 3,
    };
  }

  // Storage Configuration
  get storage(): StorageConfig {
    return {
      rawStore: this.cfg.get<'gridfs' | 'minio'>('RAW_STORE') || 'gridfs',
      minioEndpoint: this.cfg.get<string>('MINIO_ENDPOINT'),
      minioPort: this.cfg.get<number>('MINIO_PORT'),
      minioUseSsl: this.cfg.get<boolean>('MINIO_USE_SSL') || false,
      minioAccessKey: this.cfg.get<string>('MINIO_ACCESS_KEY'),
      minioSecretKey: this.cfg.get<string>('MINIO_SECRET_KEY'),
      minioBucket: this.cfg.get<string>('MINIO_BUCKET') || 'rawpayloads',
      presignTtlSec: this.cfg.get<number>('PRESIGN_TTL_SEC') || 60,
    };
  }

  // Security Configuration
  get security(): SecurityConfig {
    return {
      apiKey: this.cfg.get<string>('API_KEY'),
      rateLimitRpm: this.cfg.get<number>('RATE_LIMIT_RPM') || 600,
      corsOrigin: this.cfg.get<string>('CORS_ORIGIN') || '*',
      corsCredentials: this.cfg.get<boolean>('CORS_CREDENTIALS') || false,
      bodyLimit: this.cfg.get<string>('BODY_LIMIT') || '10mb',
    };
  }

  // HMAC Authentication Configuration
  get hmac(): HmacConfig {
    return {
      secretKey:
        this.cfg.get<string>('HMAC_SECRET_KEY') || 'default-secret-key-change-in-production',
      algorithm: (this.cfg.get<string>('HMAC_ALGORITHM') as 'sha256' | 'sha512') || 'sha256',
      timestampTolerance: this.cfg.get<number>('HMAC_TIMESTAMP_TOLERANCE') || 300,
      nonceLength: this.cfg.get<number>('HMAC_NONCE_LENGTH') || 16,
      nonceTtl: this.cfg.get<number>('HMAC_NONCE_TTL') || 3600,
    };
  }

  // Observability Configuration
  get observability(): ObservabilityConfig {
    return {
      metricsEnabled: this.cfg.get<boolean>('METRICS_ENABLED') || true,
      otelEnabled: this.cfg.get<boolean>('OTEL_ENABLED') || false,
      logLevel: this.cfg.get<'error' | 'warn' | 'info' | 'debug'>('LOG_LEVEL') || 'info',
      healthCheckTimeout: this.cfg.get<number>('HEALTH_CHECK_TIMEOUT') || 5000,
      healthCheckInterval: this.cfg.get<number>('HEALTH_CHECK_INTERVAL') || 30000,
    };
  }

  // Producer Configuration
  get producer(): ProducerConfig {
    return {
      devices: this.cfg.get<number>('PRODUCER_DEVICES') || 5,
      ratePerSec: this.cfg.get<number>('PRODUCER_RATE_PER_SEC') || 5,
      mode: this.cfg.get<'steady' | 'burst'>('PRODUCER_MODE') || 'steady',
      burstSize: this.cfg.get<number>('PRODUCER_BURST_SIZE') || 100,
    };
  }

  // Legacy getters for backward compatibility
  get mongoUri(): string {
    return this.database.uri;
  }
  get mongoDb(): string {
    return this.database.dbName;
  }
  get rabbitUri(): string {
    return this.rabbitmq.uri;
  }
  get rabbitExchange(): string {
    return this.rabbitmq.exchange;
  }
  get rabbitQueue(): string {
    return this.rabbitmq.queue;
  }
  get rabbitDlx(): string {
    return this.rabbitmq.dlx;
  }
  get rabbitHeartbeat(): number {
    return this.rabbitmq.heartbeat;
  }
  get rabbitPrefetch(): number {
    return this.rabbitmq.prefetch;
  }
  get rabbitRetryMax(): number {
    return this.rabbitmq.retryMax;
  }
  get redisUri(): string {
    return this.redis.uri;
  }
  get idempTtlSec(): number {
    return this.redis.idempTtlSec;
  }
  get rawStore(): 'gridfs' | 'minio' {
    return this.storage.rawStore;
  }
  get minioEndpoint(): string | undefined {
    return this.storage.minioEndpoint;
  }
  get minioPort(): number | undefined {
    return this.storage.minioPort;
  }
  get minioUseSsl(): boolean {
    return this.storage.minioUseSsl;
  }
  get minioAccessKey(): string | undefined {
    return this.storage.minioAccessKey;
  }
  get minioSecretKey(): string | undefined {
    return this.storage.minioSecretKey;
  }
  get minioBucket(): string {
    return this.storage.minioBucket;
  }
  get presignTtlSec(): number {
    return this.storage.presignTtlSec;
  }
  get apiKey(): string | undefined {
    return this.security.apiKey;
  }
  get rateLimitRpm(): number {
    return this.security.rateLimitRpm;
  }
  get metricsEnabled(): boolean {
    return this.observability.metricsEnabled;
  }
  get otelEnabled(): boolean {
    return this.observability.otelEnabled;
  }

  // Utility methods
  isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }
  isProduction(): boolean {
    return this.nodeEnv === 'production';
  }
  isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  // Environment-specific configuration getters
  get environment(): EnvironmentConfig {
    return this.environmentConfig;
  }

  get features() {
    return this.environmentConfig.features;
  }

  get environmentSecurity() {
    return this.environmentConfig.security;
  }

  get logging() {
    return this.environmentConfig.logging;
  }

  // Feature flags
  isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
    return this.environmentConfig.features[feature];
  }

  // Get configuration for a specific service
  getServiceConfig(service: 'api' | 'producer' | 'signals') {
    const portMap = {
      api: this.cfg.get<number>('API_PORT') || 3000,
      producer: this.cfg.get<number>('PRODUCER_PORT') || 3001,
      signals: this.cfg.get<number>('SIGNALS_PORT') || 3002,
    };

    const urlMap = {
      api: this.cfg.get<string>('API_BASE_URL') || 'http://localhost:3000',
      producer: this.cfg.get<string>('PRODUCER_BASE_URL') || 'http://localhost:3001',
      signals: this.cfg.get<string>('SIGNALS_BASE_URL') || 'http://localhost:3002',
    };

    return {
      port: portMap[service],
      url: urlMap[service],
      environment: this.nodeEnv,
      features: this.features,
    };
  }

  // Enhanced validation method
  validate(): void {
    // Basic validation
    if (!this.database.uri) {
      throw new Error('MONGO_URI is required');
    }
    if (!this.rabbitmq.uri) {
      throw new Error('RABBITMQ_URI is required');
    }
    if (!this.redis.uri) {
      throw new Error('REDIS_URI is required');
    }

    // Environment-specific validation
    validateEnvironmentConfig(this.environmentConfig);
    this.validateRequiredConfig();
  }
}
