import * as Joi from 'joi';

// Database Configuration Schema
export const databaseConfigSchema = Joi.object({
  MONGO_URI: Joi.string().uri().required(),
  MONGO_DB: Joi.string().default('iotp'),
  MONGO_CONNECTION_TIMEOUT: Joi.number().default(30000),
  MONGO_SOCKET_TIMEOUT: Joi.number().default(45000),
});

// RabbitMQ Configuration Schema
export const rabbitmqConfigSchema = Joi.object({
  RABBITMQ_URI: Joi.string().uri().required(),
  RABBITMQ_EXCHANGE: Joi.string().default('iot.xray'),
  RABBITMQ_QUEUE: Joi.string().default('xray.raw.q'),
  RABBITMQ_DLX: Joi.string().default('iot.dlx'),
  RABBITMQ_HEARTBEAT: Joi.number().default(30),
  RABBITMQ_PREFETCH: Joi.number().default(50),
  RABBITMQ_RETRY_MAX: Joi.number().default(3),
  RABBITMQ_CONNECTION_TIMEOUT: Joi.number().default(5000),
});

// Redis Configuration Schema
export const redisConfigSchema = Joi.object({
  REDIS_URI: Joi.string().uri().required(),
  IDEMP_TTL_SEC: Joi.number().default(900),
  REDIS_CONNECTION_TIMEOUT: Joi.number().default(5000),
  REDIS_RETRY_ATTEMPTS: Joi.number().default(3),
});

// Raw Storage Configuration Schema
export const storageConfigSchema = Joi.object({
  RAW_STORE: Joi.string().valid('gridfs', 'minio').default('gridfs'),
  MINIO_ENDPOINT: Joi.string().optional(),
  MINIO_PORT: Joi.number().optional(),
  MINIO_USE_SSL: Joi.boolean().default(false),
  MINIO_ACCESS_KEY: Joi.string().optional(),
  MINIO_SECRET_KEY: Joi.string().optional(),
  MINIO_BUCKET: Joi.string().default('rawpayloads'),
  PRESIGN_TTL_SEC: Joi.number().default(60),
});

// Security Configuration Schema
export const securityConfigSchema = Joi.object({
  API_KEY: Joi.string().optional(),
  RATE_LIMIT_RPM: Joi.number().default(600),
  CORS_ORIGIN: Joi.string().default('*'),
  CORS_CREDENTIALS: Joi.boolean().default(false),
  BODY_LIMIT: Joi.string().default('10mb'),
});

// Observability Configuration Schema
export const observabilityConfigSchema = Joi.object({
  METRICS_ENABLED: Joi.boolean().default(true),
  OTEL_ENABLED: Joi.boolean().default(false),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  HEALTH_CHECK_TIMEOUT: Joi.number().default(5000),
  HEALTH_CHECK_INTERVAL: Joi.number().default(30000),
});

// Producer Configuration Schema
export const producerConfigSchema = Joi.object({
  PRODUCER_DEVICES: Joi.number().default(5),
  PRODUCER_RATE_PER_SEC: Joi.number().default(5),
  PRODUCER_MODE: Joi.string().valid('steady', 'burst').default('steady'),
  PRODUCER_BURST_SIZE: Joi.number().default(100),
});

// Main Configuration Schema - Merge all schemas
export const configSchema = Joi.object({
  // Node Environment
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(3000),
  HOST: Joi.string().default('0.0.0.0'),

  // Database Configuration
  MONGO_URI: Joi.string().uri().required(),
  MONGO_DB: Joi.string().default('iotp'),
  MONGO_CONNECTION_TIMEOUT: Joi.number().default(30000),
  MONGO_SOCKET_TIMEOUT: Joi.number().default(45000),

  // RabbitMQ Configuration
  RABBITMQ_URI: Joi.string().uri().required(),
  RABBITMQ_EXCHANGE: Joi.string().default('iot.xray'),
  RABBITMQ_QUEUE: Joi.string().default('xray.raw.q'),
  RABBITMQ_DLX: Joi.string().default('iot.dlx'),
  RABBITMQ_HEARTBEAT: Joi.number().default(30),
  RABBITMQ_PREFETCH: Joi.number().default(50),
  RABBITMQ_RETRY_MAX: Joi.number().default(3),
  RABBITMQ_CONNECTION_TIMEOUT: Joi.number().default(5000),

  // Redis Configuration
  REDIS_URI: Joi.string().uri().required(),
  IDEMP_TTL_SEC: Joi.number().default(900),
  REDIS_CONNECTION_TIMEOUT: Joi.number().default(5000),
  REDIS_RETRY_ATTEMPTS: Joi.number().default(3),

  // Raw Storage Configuration
  RAW_STORE: Joi.string().valid('gridfs', 'minio').default('gridfs'),
  MINIO_ENDPOINT: Joi.string().optional(),
  MINIO_PORT: Joi.number().optional(),
  MINIO_USE_SSL: Joi.boolean().default(false),
  MINIO_ACCESS_KEY: Joi.string().optional(),
  MINIO_SECRET_KEY: Joi.string().optional(),
  MINIO_BUCKET: Joi.string().default('rawpayloads'),
  PRESIGN_TTL_SEC: Joi.number().default(60),

  // Security Configuration
  API_KEY: Joi.string().optional(),
  RATE_LIMIT_RPM: Joi.number().default(600),
  CORS_ORIGIN: Joi.string().default('*'),
  CORS_CREDENTIALS: Joi.boolean().default(false),
  BODY_LIMIT: Joi.string().default('10mb'),

  // Observability Configuration
  METRICS_ENABLED: Joi.boolean().default(true),
  OTEL_ENABLED: Joi.boolean().default(false),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  HEALTH_CHECK_TIMEOUT: Joi.number().default(5000),
  HEALTH_CHECK_INTERVAL: Joi.number().default(30000),

  // Producer Configuration
  PRODUCER_DEVICES: Joi.number().default(5),
  PRODUCER_RATE_PER_SEC: Joi.number().default(5),
  PRODUCER_MODE: Joi.string().valid('steady', 'burst').default('steady'),
  PRODUCER_BURST_SIZE: Joi.number().default(100),
}).unknown(true);

// Environment-specific validation
export const validateConfig = (config: Record<string, unknown>) => {
  const result = configSchema.validate(config, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });

  if (result.error) {
    throw new Error(`Configuration validation failed: ${result.error.message}`);
  }

  return result.value as Joi.ValidationResult<typeof configSchema>;
};
