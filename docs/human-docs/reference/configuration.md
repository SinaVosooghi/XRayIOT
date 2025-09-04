# Configuration Reference - XRayIOT

## 🎯 **Complete Configuration Guide**

This document provides comprehensive configuration options for all XRayIOT services and components.

## 📋 **Environment Variables**

### **Core Application Configuration**

#### **Node.js Environment**
```bash
# Application environment
NODE_ENV=development|production|test
PORT=3000
LOG_LEVEL=debug|info|warn|error
```

#### **Service Ports**
```bash
# API Service
API_PORT=3000

# Signals Service  
SIGNALS_PORT=3002

# Producer Service
PRODUCER_PORT=3001
```

### **Database Configuration**

#### **MongoDB Settings**
```bash
# MongoDB connection
MONGO_URI=mongodb://admin:password@localhost:27017/iotp?authSource=admin
MONGO_DB=iotp

# MongoDB options
MONGO_MAX_POOL_SIZE=10
MONGO_MIN_POOL_SIZE=2
MONGO_MAX_IDLE_TIME_MS=30000
MONGO_SERVER_SELECTION_TIMEOUT_MS=5000
MONGO_CONNECT_TIMEOUT_MS=10000
MONGO_SOCKET_TIMEOUT_MS=45000
```

#### **Redis Settings**
```bash
# Redis connection
REDIS_URI=redis://localhost:6379

# Redis options
REDIS_MAX_RETRIES=3
REDIS_RETRY_DELAY_MS=1000
REDIS_CONNECT_TIMEOUT_MS=10000
REDIS_COMMAND_TIMEOUT_MS=5000

# TTL settings
IDEMP_TTL_SEC=900
HMAC_NONCE_TTL_SEC=300
SESSION_TTL_SEC=3600
```

### **Message Queue Configuration**

#### **RabbitMQ Settings**
```bash
# RabbitMQ connection
RABBITMQ_URI=amqp://admin:password@localhost:5672

# Exchange and Queue names
RABBITMQ_EXCHANGE=iot.xray
RABBITMQ_QUEUE=xray.raw.q
RABBITMQ_DLX=iot.dlx
RABBITMQ_RETRY_QUEUE=xray.raw.v1.retry

# Queue options
RABBITMQ_PREFETCH_COUNT=50
RABBITMQ_ACK_TIMEOUT_MS=30000
RABBITMQ_RETRY_ATTEMPTS=3
RABBITMQ_RETRY_DELAY_MS=1000
```

### **Security Configuration**

#### **API Authentication**
```bash
# API key authentication
API_KEY=your-secure-api-key
API_KEY_HEADER=x-api-key

# Rate limiting
RATE_LIMIT_RPM=600
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false
RATE_LIMIT_SKIP_FAILED_REQUESTS=false
```

#### **HMAC Authentication**
```bash
# HMAC settings
HMAC_SECRET=your-secure-hmac-secret
HMAC_ALGORITHM=sha256
HMAC_TIMESTAMP_TOLERANCE_MS=300000
HMAC_NONCE_LENGTH=32
```

#### **CORS Configuration**
```bash
# CORS settings
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com
CORS_METHODS=GET,POST,PUT,PATCH,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=Content-Type,Authorization,x-api-key
CORS_CREDENTIALS=true
CORS_MAX_AGE=86400
```

### **Performance Configuration**

#### **Connection Pooling**
```bash
# MongoDB connection pool
MONGO_MAX_POOL_SIZE=10
MONGO_MIN_POOL_SIZE=2
MONGO_MAX_IDLE_TIME_MS=30000

# Redis connection pool
REDIS_MAX_RETRIES=3
REDIS_RETRY_DELAY_MS=1000

# RabbitMQ connection pool
RABBITMQ_CONNECTION_POOL_SIZE=5
RABBITMQ_CHANNEL_POOL_SIZE=10
```

#### **Caching Configuration**
```bash
# Redis caching
CACHE_TTL_SEC=3600
CACHE_MAX_KEYS=10000
CACHE_CLEANUP_INTERVAL_MS=300000

# Application caching
ENABLE_RESPONSE_CACHING=true
RESPONSE_CACHE_TTL_SEC=300
```

### **Logging Configuration**

#### **Log Settings**
```bash
# Logging level
LOG_LEVEL=info
LOG_FORMAT=json
LOG_TIMESTAMP=true
LOG_CORRELATION_ID=true

# Log files
LOG_FILE=logs/app.log
LOG_MAX_SIZE=10MB
LOG_MAX_FILES=5
LOG_COMPRESS=true
```

#### **Structured Logging**
```bash
# Log fields
LOG_INCLUDE_PID=true
LOG_INCLUDE_HOSTNAME=true
LOG_INCLUDE_SERVICE_NAME=true
LOG_INCLUDE_VERSION=true
```

### **Monitoring Configuration**

#### **Health Checks**
```bash
# Health check settings
HEALTH_CHECK_INTERVAL_MS=30000
HEALTH_CHECK_TIMEOUT_MS=5000
HEALTH_CHECK_RETRIES=3

# Metrics
ENABLE_METRICS=true
METRICS_PORT=9090
METRICS_PATH=/metrics
```

#### **Tracing Configuration**
```bash
# OpenTelemetry settings
ENABLE_TRACING=true
TRACING_SERVICE_NAME=xrayiot-api
TRACING_SERVICE_VERSION=1.0.0
TRACING_JAEGER_ENDPOINT=http://localhost:14268/api/traces
```

## 🏗️ **Service-Specific Configuration**

### **API Service Configuration**

#### **API Settings**
```bash
# API configuration
API_PREFIX=/api
API_VERSION=v1
API_DOCS_PATH=/api/docs
API_SWAGGER_TITLE=XRayIOT API
API_SWAGGER_DESCRIPTION=IoT X-Ray Data Platform API
API_SWAGGER_VERSION=1.0.0
```

#### **Pagination Settings**
```bash
# Pagination defaults
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
DEFAULT_SORT_FIELD=timestamp
DEFAULT_SORT_ORDER=desc
```

#### **Validation Settings**
```bash
# Input validation
VALIDATION_STRIP_UNKNOWN=true
VALIDATION_WHITELIST=true
VALIDATION_FORBID_NON_WHITELISTED=true
VALIDATION_TRANSFORM=true
```

### **Signals Service Configuration**

#### **Message Processing**
```bash
# Processing settings
MESSAGE_BATCH_SIZE=10
MESSAGE_PROCESSING_TIMEOUT_MS=30000
MESSAGE_RETRY_ATTEMPTS=3
MESSAGE_RETRY_DELAY_MS=1000
```

#### **Data Storage**
```bash
# Storage settings
GRIDFS_BUCKET_NAME=raw_payloads
GRIDFS_CHUNK_SIZE=261120
GRIDFS_MAX_FILE_SIZE=16777216
```

#### **Idempotency Settings**
```bash
# Idempotency configuration
ENABLE_IDEMPOTENCY=true
IDEMPOTENCY_KEY_HEADER=x-idempotency-key
IDEMPOTENCY_TTL_SEC=900
```

### **Producer Service Configuration**

#### **Data Generation**
```bash
# Generation settings
GENERATION_INTERVAL_MS=1000
GENERATION_BATCH_SIZE=1
GENERATION_MAX_MESSAGES=1000
GENERATION_RANDOM_DELAY_MS=500
```

#### **Message Publishing**
```bash
# Publishing settings
PUBLISH_RETRY_ATTEMPTS=3
PUBLISH_RETRY_DELAY_MS=1000
PUBLISH_CONFIRM_TIMEOUT_MS=5000
```

## 🐳 **Docker Configuration**

### **Docker Compose Environment**

#### **Development Environment**
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  api:
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
      - MONGO_URI=mongodb://admin:password@mongodb:27017/iotp?authSource=admin
      - REDIS_URI=redis://redis:6379
      - RABBITMQ_URI=amqp://admin:password@rabbitmq:5672
```

#### **Production Environment**
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  api:
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
      - MONGO_URI=${MONGO_URI}
      - REDIS_URI=${REDIS_URI}
      - RABBITMQ_URI=${RABBITMQ_URI}
```

### **Docker Build Configuration**

#### **Multi-stage Build**
```dockerfile
# Dockerfile.optimized
ARG NODE_OPTIONS=--max-old-space-size=4096
ENV NODE_OPTIONS=$NODE_OPTIONS

# Build arguments
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=1.0.0

# Labels
LABEL org.label-schema.build-date=$BUILD_DATE
LABEL org.label-schema.vcs-ref=$VCS_REF
LABEL org.label-schema.version=$VERSION
```

## 🧪 **Testing Configuration**

### **Test Environment**
```bash
# Test database
TEST_MONGO_URI=mongodb://admin:password@localhost:27017/iotp_test?authSource=admin
TEST_MONGO_DB=iotp_test

# Test Redis
TEST_REDIS_URI=redis://localhost:6379/1

# Test RabbitMQ
TEST_RABBITMQ_URI=amqp://admin:password@localhost:5672
```

### **Test Containers**
```bash
# Testcontainer settings
TESTCONTAINER_RYUK_DISABLED=false
TESTCONTAINER_RYUK_CONTAINER_IMAGE=quay.io/testcontainers/ryuk:0.5.1
TESTCONTAINER_RYUK_PRIVILEGED=true
```

## 🔧 **Configuration Management**

### **Environment Files**

#### **Development (.env)**
```bash
# Copy template
cp env.example .env

# Edit configuration
nano .env
```

#### **Production (.env.production)**
```bash
# Copy template
cp env.production.example .env.production

# Edit configuration
nano .env.production
```

#### **Testing (.env.test)**
```bash
# Copy template
cp env.test.example .env.test

# Edit configuration
nano .env.test
```

### **Configuration Validation**

#### **Schema Validation**
```typescript
// config/schema.ts
import Joi from 'joi';

export const configSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
  PORT: Joi.number().port().default(3000),
  MONGO_URI: Joi.string().uri().required(),
  REDIS_URI: Joi.string().uri().required(),
  RABBITMQ_URI: Joi.string().uri().required(),
  API_KEY: Joi.string().min(32).required(),
  RATE_LIMIT_RPM: Joi.number().min(1).max(10000).default(600),
});
```

#### **Configuration Loading**
```typescript
// config/configuration.ts
import { configSchema } from './schema';

export const configuration = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI,
  redisUri: process.env.REDIS_URI,
  rabbitmqUri: process.env.RABBITMQ_URI,
  apiKey: process.env.API_KEY,
  rateLimitRpm: parseInt(process.env.RATE_LIMIT_RPM, 10) || 600,
};

// Validate configuration
const { error, value } = configSchema.validate(configuration);
if (error) {
  throw new Error(`Configuration validation error: ${error.message}`);
}
```

## 📊 **Configuration Examples**

### **Complete Development Configuration**
```bash
# .env
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# MongoDB
MONGO_URI=mongodb://admin:password@localhost:27017/iotp?authSource=admin
MONGO_DB=iotp

# Redis
REDIS_URI=redis://localhost:6379
IDEMP_TTL_SEC=900
HMAC_NONCE_TTL_SEC=300

# RabbitMQ
RABBITMQ_URI=amqp://admin:password@localhost:5672
RABBITMQ_EXCHANGE=iot.xray
RABBITMQ_QUEUE=xray.raw.q
RABBITMQ_DLX=iot.dlx

# API
API_KEY=dev-api-key-123456789012345678901234567890
RATE_LIMIT_RPM=600

# Security
HMAC_SECRET=dev-hmac-secret-123456789012345678901234567890
```

### **Complete Production Configuration**
```bash
# .env.production
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# MongoDB
MONGO_URI=mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/iotp?authSource=admin
MONGO_DB=iotp

# Redis
REDIS_URI=redis://redis:6379
IDEMP_TTL_SEC=900
HMAC_NONCE_TTL_SEC=300

# RabbitMQ
RABBITMQ_URI=amqp://admin:${RABBITMQ_PASSWORD}@rabbitmq:5672
RABBITMQ_EXCHANGE=iot.xray
RABBITMQ_QUEUE=xray.raw.q
RABBITMQ_DLX=iot.dlx

# API
API_KEY=${API_KEY}
RATE_LIMIT_RPM=600

# Security
HMAC_SECRET=${HMAC_SECRET}
```

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Production Ready
