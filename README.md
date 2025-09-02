# 🏥 PANTOhealth IoT X-Ray Data Platform

A robust, scalable IoT data management system built with NestJS that processes X-ray data from IoT devices using RabbitMQ, stores processed information in MongoDB, and provides comprehensive API endpoints for data retrieval and analysis.

## 🚀 Features

- **Microservices Architecture** - API, Signals, and Producer services
- **Real-time Data Processing** - RabbitMQ-based message queuing
- **Scalable Storage** - MongoDB with GridFS for raw payload storage
- **Idempotency** - Redis-based duplicate prevention
- **Comprehensive Testing** - Unit tests + E2E tests with real infrastructure
- **Docker Support** - Full containerization for all environments
- **API Documentation** - Swagger/OpenAPI integration
- **Health Monitoring** - Built-in health checks and observability

## 🏗️ Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Producer  │    │    API     │    │   Signals  │
│  (Port 3001)│    │ (Port 3000)│    │ (Port 3002)│
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
                   ┌──────▼──────┐
                   │  RabbitMQ   │
                   │  (Port 5672)│
                   └──────┬──────┘
                          │
                   ┌──────▼──────┐
                   │   MongoDB   │
                   │ (Port 27017)│
                   └──────┬──────┘
                          │
                   ┌──────▼──────┐
                   │    Redis    │
                   │  (Port 6379)│
                   └─────────────┘
```

## 📋 Prerequisites

- **Node.js** 18+ 
- **Yarn** 4.0.0+
- **Docker** & **Docker Compose**
- **MongoDB** 7+
- **RabbitMQ** 3.12+
- **Redis** 7+

## 🛠️ Quick Start

### Development Environment

```bash
# 1. Clone and setup
git clone <repository-url>
cd XRayIOT
yarn install

# 2. Configure environment
cp env.example .env
# Edit .env with your local settings

# 3. Start infrastructure only
yarn infra:up

# 4. Start development services
yarn dev:api        # API service
yarn dev:signals    # Signals service  
yarn dev:producer   # Producer service
```

### Production Environment

```bash
# 1. Configure production environment
cp env.production.example .env.production
# Edit .env.production with production settings

# 2. Start all services
yarn docker:up
```

### E2E Testing

```bash
# 1. Configure test environment
cp env.test.example .env.test
# Edit .env.test with test settings

# 2. Setup test infrastructure
yarn test:docker:setup

# 3. Run E2E tests
yarn test:e2e

# 4. Cleanup (optional)
yarn test:docker:teardown
```

### Unit Testing

```bash
# Run all unit tests
yarn test

# Run specific service tests
yarn test:api
yarn test:signals
yarn test:producer

# Watch mode
yarn test:watch

# Coverage report
yarn test:coverage
```

## 🏗️ Project Structure

```
XRayIOT/
├── apps/                          # Microservices
│   ├── api/                      # REST API service
│   ├── signals/                  # Data processing service
│   └── producer/                 # IoT data producer
├── libs/                         # Shared libraries
│   ├── shared-types/            # TypeScript type definitions
│   ├── shared-messaging/        # RabbitMQ & message handling
│   ├── shared-config/           # Configuration management
│   ├── shared-utils/            # Utility functions
│   └── shared-observability/    # Monitoring & logging
├── e2e/                         # End-to-end tests
├── docker-compose.yml           # Production environment
├── docker-compose.test-full.yml # Test environment
└── docker-compose.dev-infrastructure.yml # Dev infrastructure
```

## 🔧 Configuration

### Environment Variables

Key configuration options in `.env` files:

```bash
# MongoDB
MONGO_URI=mongodb://admin:password@localhost:27017/iotp?authSource=admin
MONGO_DB=iotp

# RabbitMQ
RABBITMQ_URI=amqp://admin:password@localhost:5672
RABBITMQ_EXCHANGE=iot.xray
RABBITMQ_QUEUE=xray.raw.q

# Redis
REDIS_URI=redis://localhost:6379
IDEMP_TTL_SEC=900

# API Security
API_KEY=your-api-key
RATE_LIMIT_RPM=600
```

### Service Ports

- **API**: 3000 (HTTP)
- **Producer**: 3001 (HTTP)
- **Signals**: 3002 (HTTP)
- **MongoDB**: 27017
- **RabbitMQ**: 5672 (AMQP), 15672 (Management)
- **Redis**: 6379

## 📡 API Endpoints

### Health Check
```bash
GET /api/health
```

### Signals
```bash
GET    /api/signals              # List signals with pagination
GET    /api/signals/:id          # Get specific signal
GET    /api/signals/:id/raw      # Get raw data
GET    /api/signals/:id/raw/metadata  # Get metadata
POST   /api/signals              # Create signal
PATCH  /api/signals/:id          # Update signal
DELETE /api/signals/:id          # Delete signal
```

### Analytics
```bash
GET /api/signals/analytics/device-stats
GET /api/signals/analytics/location-clusters
GET /api/signals/analytics/time-trends
```

### Storage
```bash
GET /api/signals/storage/stats
```

## 🧪 Testing Strategy

### Unit Tests
- **Coverage**: All critical business logic
- **Frameworks**: Jest + NestJS testing utilities
- **Location**: `apps/*/src/**/*.spec.ts`

### E2E Tests
- **Coverage**: Full data flow through real infrastructure
- **Frameworks**: Jest + real Docker services
- **Location**: `e2e/real-infrastructure.e2e-spec.ts`
- **Test Categories**:
  - Complete Data Flow
  - Raw Data Storage
  - Error Handling
  - Performance & Load Testing
  - System Resilience
  - Security & Access Control

### Test Utilities
- **Test Infrastructure**: `e2e/test-infrastructure.ts`
- **Common Utils**: `e2e/utils.ts`
- **Database Cleanup**: Automatic cleanup between tests

## 🐳 Docker Support

### Production
```bash
docker-compose up -d
```

### Testing
```bash
docker-compose -f docker-compose.test-full.yml up -d
```

### Development Infrastructure Only
```bash
docker-compose -f docker-compose.dev-infrastructure.yml up -d
```

## 📊 Data Flow

1. **IoT Device** → **Producer Service** (X-ray data)
2. **Producer** → **RabbitMQ** (Message queue)
3. **Signals Service** ← **RabbitMQ** (Consume messages)
4. **Signals Service** → **MongoDB** (Store processed data)
5. **Signals Service** → **GridFS** (Store raw payloads)
6. **API Service** ← **MongoDB** (Serve data)
7. **Client** ← **API Service** (REST endpoints)

## 🔒 Security Features

- **API Key Authentication**
- **Rate Limiting**
- **CORS Configuration**
- **Input Validation**
- **Error Handling**

## 📈 Monitoring & Observability

- **Health Checks**: Built-in health endpoints
- **Metrics**: Prometheus metrics (optional)
- **Logging**: Structured logging with Pino
- **Tracing**: OpenTelemetry support (optional)

## 🚀 Performance Features

- **Message Batching**: Configurable batch processing
- **Connection Pooling**: MongoDB and RabbitMQ
- **Caching**: Redis-based caching
- **Async Processing**: Non-blocking message handling

## 🛠️ Development Commands

```bash
# Build
yarn build

# Linting
yarn lint
yarn lint:check

# Formatting
yarn format
yarn format:check

# Development
yarn dev:api
yarn dev:signals
yarn dev:producer

# Docker
yarn docker:up
yarn docker:down
yarn docker:logs

# Infrastructure
yarn infra:up
yarn infra:down
yarn infra:logs
```

## 📚 Documentation

- **API Docs**: Swagger UI at `/api` endpoint
- **Type Definitions**: Comprehensive TypeScript types
- **Configuration**: Environment-based configuration
- **Testing**: Extensive test coverage and examples

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is proprietary software developed for PANTOhealth.

## 🆘 Support

For technical support or questions:
- Check the test files for usage examples
- Review the shared library implementations
- Check the E2E tests for integration patterns

---

**Built with ❤️ using NestJS, MongoDB, RabbitMQ, and Redis**
# CI Test
