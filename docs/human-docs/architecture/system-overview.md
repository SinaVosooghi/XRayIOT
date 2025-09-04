# System Overview - XRayIOT

## 🎯 **System Architecture**

XRayIOT is a robust, scalable IoT data management system that processes GPS/telemetry data from IoT devices using a microservices architecture.

## 🏗️ **High-Level Architecture**

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

## 🔄 **Data Flow**

### **1. Data Ingestion**
```
IoT Device → Producer Service → RabbitMQ Queue
```

### **2. Data Processing**
```
RabbitMQ Queue → Signals Service → MongoDB + Redis
```

### **3. Data Retrieval**
```
Client → API Service → MongoDB → Client
```

## 🏢 **Microservices Architecture**

### **Producer Service**
**Purpose**: Simulates IoT devices and publishes data to the message queue

**Responsibilities**:
- Generate test IoT data (GPS coordinates, speed, timestamp)
- Publish messages to RabbitMQ with HMAC authentication
- Handle message acknowledgments and retries

**Technology**: NestJS, TypeScript, RabbitMQ client

### **Signals Service**
**Purpose**: Processes incoming IoT messages and stores them in the database

**Responsibilities**:
- Consume messages from RabbitMQ
- Validate message format and authenticity
- Process and transform data
- Store processed data in MongoDB
- Store raw payloads in GridFS
- Handle idempotency with Redis

**Technology**: NestJS, TypeScript, MongoDB, Redis, RabbitMQ

### **API Service**
**Purpose**: Provides REST endpoints for data retrieval and analysis

**Responsibilities**:
- Expose REST API endpoints
- Handle authentication and authorization
- Query processed data from MongoDB
- Provide analytics and reporting endpoints
- Rate limiting and security

**Technology**: NestJS, TypeScript, MongoDB, Swagger/OpenAPI

## 🗄️ **Data Storage**

### **MongoDB**
**Purpose**: Primary database for processed data and metadata

**Collections**:
- **signals**: Processed IoT data with metadata
- **raw_payloads**: Raw message payloads (GridFS)
- **sessions**: User sessions and authentication

**Features**:
- Document-based storage for flexible schema
- GridFS for large file storage
- Performance indexes for fast queries
- TTL policies for automatic cleanup

### **Redis**
**Purpose**: Caching and idempotency

**Use Cases**:
- Idempotency keys (900-second TTL)
- HMAC nonce tracking (300-second TTL)
- Session data caching
- Rate limiting counters

### **RabbitMQ**
**Purpose**: Message queue for service communication

**Configuration**:
- **Exchange**: `iot.xray` (topic exchange)
- **Queue**: `xray.raw.q` (main processing queue)
- **DLQ**: `iot.dlx` (dead letter exchange)
- **Retry Queue**: `xray.raw.v1.retry`

## 🔒 **Security Architecture**

### **Authentication**
- **API Keys**: Simple authentication for REST endpoints
- **HMAC Signatures**: Message authentication between services
- **Nonce Replay Protection**: Prevents replay attacks

### **Authorization**
- **Rate Limiting**: 600 requests per minute per API key
- **CORS**: Configured for cross-origin requests
- **Input Validation**: Comprehensive validation for all inputs

### **Data Protection**
- **Encryption in Transit**: TLS/SSL for all communications
- **Encryption at Rest**: MongoDB and Redis encryption
- **Secure Headers**: XSS, CSRF, and other security headers

## 📊 **Performance Characteristics**

### **Throughput**
- **API Requests**: 100+ requests/minute
- **Message Processing**: 50+ messages/minute
- **Database Queries**: 200+ queries/minute

### **Latency**
- **API Response**: <200ms average
- **Message Processing**: <150ms average
- **Database Queries**: <100ms average

### **Scalability**
- **Horizontal Scaling**: All services can scale independently
- **Load Balancing**: Nginx reverse proxy
- **Database Sharding**: MongoDB sharding support
- **Message Partitioning**: RabbitMQ partitioning support

## 🔧 **Technology Stack**

### **Backend Services**
- **Framework**: NestJS (Node.js)
- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js 22+

### **Databases**
- **Primary**: MongoDB 7.0+
- **Cache**: Redis 7.2+
- **Message Queue**: RabbitMQ 3.12+

### **Infrastructure**
- **Containerization**: Docker, Docker Compose
- **Reverse Proxy**: Nginx
- **SSL/TLS**: Let's Encrypt
- **Monitoring**: Built-in health checks

### **Development Tools**
- **Testing**: Jest, Testcontainers
- **Linting**: ESLint, Prettier
- **CI/CD**: GitHub Actions
- **Documentation**: Swagger/OpenAPI

## 🧪 **Testing Strategy**

### **Unit Tests**
- **Coverage**: 95%+ for critical business logic
- **Framework**: Jest with NestJS testing utilities
- **Location**: `apps/*/src/**/*.spec.ts`

### **Integration Tests**
- **Coverage**: Service-to-service communication
- **Framework**: Jest with real infrastructure
- **Location**: `e2e/integration/`

### **E2E Tests**
- **Coverage**: Complete data flow through real infrastructure
- **Framework**: Jest with Testcontainers
- **Location**: `e2e/real-infrastructure.e2e-spec.ts`

## 📈 **Monitoring & Observability**

### **Health Checks**
- **Service Health**: All services have health endpoints
- **Dependency Health**: Database and queue connectivity
- **Performance Metrics**: Response times and throughput

### **Logging**
- **Structured Logging**: JSON format with correlation IDs
- **Log Levels**: Debug, Info, Warn, Error
- **Log Aggregation**: Centralized logging system

### **Metrics**
- **Application Metrics**: Request count, response time, error rate
- **Infrastructure Metrics**: CPU, memory, disk usage
- **Business Metrics**: Data processing volume, user activity

## 🚀 **Deployment Architecture**

### **Development Environment**
- **Local Development**: Docker Compose with hot reload
- **Testing**: Isolated test environment with Testcontainers
- **Debugging**: Full debugging support with VS Code

### **Production Environment**
- **Container Orchestration**: Docker Compose
- **Reverse Proxy**: Nginx with SSL termination
- **Load Balancing**: Nginx upstream configuration
- **Monitoring**: Health checks and alerting

### **CI/CD Pipeline**
- **Source Control**: GitHub with branch protection
- **Testing**: Automated testing on every commit
- **Security**: Automated security scanning
- **Deployment**: Automated deployment to production

## 🔮 **Future Architecture Considerations**

### **Scalability**
- **Kubernetes**: Container orchestration for large scale
- **Service Mesh**: Istio for service-to-service communication
- **API Gateway**: Kong or similar for API management

### **Observability**
- **Distributed Tracing**: Jaeger or Zipkin
- **Metrics**: Prometheus and Grafana
- **Logging**: ELK stack (Elasticsearch, Logstash, Kibana)

### **Data Processing**
- **Stream Processing**: Apache Kafka for real-time processing
- **Data Pipeline**: Apache Airflow for batch processing
- **Analytics**: ClickHouse or similar for analytics

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Production Ready  
**Architecture**: Microservices
