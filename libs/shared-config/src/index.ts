// Configuration Module
export { SharedConfigModule } from './config.module';

// Configuration Service
export { ConfigService } from './config.service';

// Configuration Interfaces
export type {
  DatabaseConfig,
  RabbitMQConfig,
  RedisConfig,
  StorageConfig,
  SecurityConfig,
  ObservabilityConfig,
  ProducerConfig,
} from './config.service';

// Configuration Schema
export {
  configSchema,
  databaseConfigSchema,
  rabbitmqConfigSchema,
  redisConfigSchema,
  storageConfigSchema,
  securityConfigSchema,
  observabilityConfigSchema,
  producerConfigSchema,
  validateConfig,
} from './config.schema';
