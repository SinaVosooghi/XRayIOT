# Local Development Setup - XRayIOT

## 🎯 **Complete Development Environment Setup**

This guide will help you set up a complete local development environment for XRayIOT, including all services, databases, and testing infrastructure.

## 📋 **Prerequisites**

### **Required Software**
- **Node.js**: 18+ (recommended: 22.x)
- **Yarn**: 4.0.0+ (will be installed via Corepack)
- **Docker**: 20.10+ with Docker Compose
- **Git**: 2.30+

### **System Requirements**
- **RAM**: 8GB+ (recommended: 16GB)
- **Disk Space**: 5GB+ free space
- **OS**: macOS, Linux, or Windows with WSL2

### **Ports Required**
- **3000**: API Service
- **3001**: Producer Service
- **3002**: Signals Service
- **27017**: MongoDB
- **5672**: RabbitMQ (AMQP)
- **15672**: RabbitMQ Management
- **6379**: Redis

## 🚀 **Quick Setup (5 Minutes)**

### **1. Clone and Install**
```bash
# Clone the repository
git clone <repository-url>
cd XRayIOT

# Install dependencies
yarn install

# Verify installation
yarn --version
node --version
```

### **2. Environment Configuration**
```bash
# Copy environment template
cp env.example .env

# Edit configuration (optional for development)
# Most defaults work for local development
nano .env
```

### **3. Start Infrastructure**
```bash
# Start all infrastructure services
yarn infra:up

# Verify services are running
docker ps
```

### **4. Start Development Services**
```bash
# Terminal 1: API Service
yarn dev:api

# Terminal 2: Signals Service
yarn dev:signals

# Terminal 3: Producer Service
yarn dev:producer
```

### **5. Verify Setup**
```bash
# Test API health
curl http://localhost:3000/api/health

# Test producer
curl http://localhost:3001/health

# Test signals
curl http://localhost:3002/health
```

## 🔧 **Detailed Setup Guide**

### **Step 1: Repository Setup**

```bash
# Clone repository
git clone <repository-url>
cd XRayIOT

# Checkout to development branch (if available)
git checkout develop

# Install dependencies
yarn install

# Verify Yarn version
yarn --version
# Should show 4.9.4 or higher
```

### **Step 2: Environment Configuration**

#### **Development Environment (.env)**
```bash
# Copy template
cp env.example .env

# Edit configuration
nano .env
```

#### **Key Configuration Options**
```bash
# Node Environment
NODE_ENV=development

# MongoDB Configuration
MONGO_URI=mongodb://admin:password@localhost:27017/iotp?authSource=admin
MONGO_DB=iotp

# RabbitMQ Configuration
RABBITMQ_URI=amqp://admin:password@localhost:5672
RABBITMQ_EXCHANGE=iot.xray
RABBITMQ_QUEUE=xray.raw.q
RABBITMQ_DLX=iot.dlx

# Redis Configuration
REDIS_URI=redis://localhost:6379
IDEMP_TTL_SEC=900
HMAC_NONCE_TTL_SEC=300

# API Configuration
API_KEY=dev-api-key-123
RATE_LIMIT_RPM=600
PORT=3000

# Service Ports
API_PORT=3000
SIGNALS_PORT=3002
PRODUCER_PORT=3001
```

### **Step 3: Infrastructure Setup**

#### **Start Infrastructure Services**
```bash
# Start MongoDB, RabbitMQ, and Redis
yarn infra:up

# Check service status
docker ps

# Expected output:
# - mongodb:7.0
# - rabbitmq:3.12-management
# - redis:7.2
```

#### **Verify Infrastructure Health**
```bash
# Check MongoDB
docker exec -it xrayiot_mongodb mongosh --eval "db.adminCommand('ping')"

# Check RabbitMQ
docker exec -it xrayiot_rabbitmq rabbitmq-diagnostics ping

# Check Redis
docker exec -it xrayiot_redis redis-cli ping
```

### **Step 4: Development Services Setup**

#### **API Service**
```bash
# Terminal 1
cd XRayIOT
yarn dev:api

# Expected output:
# [Nest] 12345  - 12/04/2024, 10:00:00 AM     LOG [NestFactory] Starting Nest application...
# [Nest] 12345  - 12/04/2024, 10:00:00 AM     LOG [InstanceLoader] AppModule dependencies initialized
# [Nest] 12345  - 12/04/2024, 10:00:00 AM     LOG [NestApplication] Nest application successfully started
# [Nest] 12345  - 12/04/2024, 10:00:00 AM     LOG [NestApplication] Application is running on: http://localhost:3000
```

#### **Signals Service**
```bash
# Terminal 2
cd XRayIOT
yarn dev:signals

# Expected output:
# [Nest] 12346  - 12/04/2024, 10:00:00 AM     LOG [NestFactory] Starting Nest application...
# [Nest] 12346  - 12/04/2024, 10:00:00 AM     LOG [InstanceLoader] AppModule dependencies initialized
# [Nest] 12346  - 12/04/2024, 10:00:00 AM     LOG [NestApplication] Nest application successfully started
# [Nest] 12346  - 12/04/2024, 10:00:00 AM     LOG [NestApplication] Application is running on: http://localhost:3002
```

#### **Producer Service**
```bash
# Terminal 3
cd XRayIOT
yarn dev:producer

# Expected output:
# [Nest] 12347  - 12/04/2024, 10:00:00 AM     LOG [NestFactory] Starting Nest application...
# [Nest] 12347  - 12/04/2024, 10:00:00 AM     LOG [InstanceLoader] AppModule dependencies initialized
# [Nest] 12347  - 12/04/2024, 10:00:00 AM     LOG [NestApplication] Nest application successfully started
# [Nest] 12347  - 12/04/2024, 10:00:00 AM     LOG [NestApplication] Application is running on: http://localhost:3001
```

### **Step 5: Verification and Testing**

#### **Health Check All Services**
```bash
# API Service
curl http://localhost:3000/api/health
# Expected: {"status":"ok","timestamp":"2024-12-04T10:00:00.000Z"}

# Producer Service
curl http://localhost:3001/health
# Expected: {"status":"ok","timestamp":"2024-12-04T10:00:00.000Z"}

# Signals Service
curl http://localhost:3002/health
# Expected: {"status":"ok","timestamp":"2024-12-04T10:00:00.000Z"}
```

#### **Test Data Flow**
```bash
# Generate test data
curl -X POST http://localhost:3001/generate-test-data

# Check if data was processed
curl http://localhost:3000/api/signals

# Expected: Array of processed signals
```

#### **Run Tests**
```bash
# Unit tests
yarn test

# Integration tests
yarn test:integration

# E2E tests
yarn test:e2e
```

## 🛠️ **Development Tools Setup**

### **IDE Configuration**

#### **VS Code (Recommended)**
```bash
# Install recommended extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-json
code --install-extension ms-vscode.vscode-yaml
```

#### **VS Code Settings (.vscode/settings.json)**
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.env*": "dotenv"
  }
}
```

### **Debugging Setup**

#### **VS Code Launch Configuration (.vscode/launch.json)**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/api/src/main.ts",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "runtimeArgs": ["-r", "ts-node/register"]
    },
    {
      "name": "Debug Signals",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/signals/src/main.ts",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "runtimeArgs": ["-r", "ts-node/register"]
    },
    {
      "name": "Debug Producer",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/producer/src/main.ts",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "runtimeArgs": ["-r", "ts-node/register"]
    }
  ]
}
```

### **Database Tools**

#### **MongoDB Compass**
```bash
# Download from: https://www.mongodb.com/products/compass
# Connection string: mongodb://admin:password@localhost:27017/iotp?authSource=admin
```

#### **RabbitMQ Management**
```bash
# Access via browser: http://localhost:15672
# Username: admin
# Password: password
```

#### **Redis Commander**
```bash
# Install globally
npm install -g redis-commander

# Start Redis Commander
redis-commander --port 8081

# Access via browser: http://localhost:8081
```

## 🧪 **Testing Setup**

### **Test Environment**
```bash
# Start test infrastructure
yarn test:docker:setup

# Run all tests
yarn test

# Run specific test suites
yarn test:unit
yarn test:integration
yarn test:e2e

# Run tests with coverage
yarn test:coverage

# Clean up test environment
yarn test:docker:teardown
```

### **Test Data Management**
```bash
# Generate test data
yarn test:data:generate

# Reset test database
yarn test:data:reset

# Seed test data
yarn test:data:seed
```

## 🔧 **Common Development Tasks**

### **Code Quality**
```bash
# Lint code
yarn lint

# Fix linting issues
yarn lint:fix

# Type check
yarn type-check

# Format code
yarn format
```

### **Database Management**
```bash
# Reset development database
yarn db:reset

# Seed development data
yarn db:seed

# Backup database
yarn db:backup

# Restore database
yarn db:restore
```

### **Service Management**
```bash
# Start all services
yarn dev:all

# Stop all services
yarn dev:stop

# Restart specific service
yarn dev:restart:api

# View service logs
yarn dev:logs:api
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Port Already in Use**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 yarn dev:api
```

#### **Docker Issues**
```bash
# Clean up Docker
docker system prune -a

# Restart Docker
sudo systemctl restart docker

# Check Docker logs
docker logs xrayiot_mongodb
```

#### **Database Connection Issues**
```bash
# Check MongoDB status
docker exec -it xrayiot_mongodb mongosh --eval "db.adminCommand('ping')"

# Check RabbitMQ status
docker exec -it xrayiot_rabbitmq rabbitmq-diagnostics ping

# Check Redis status
docker exec -it xrayiot_redis redis-cli ping
```

#### **Dependency Issues**
```bash
# Clean install
rm -rf node_modules yarn.lock
yarn install

# Clear Yarn cache
yarn cache clean

# Reinstall dependencies
yarn install --force
```

### **Performance Issues**

#### **Slow Startup**
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" yarn dev:api

# Use faster file watcher
yarn dev:api --watch
```

#### **High Memory Usage**
```bash
# Monitor memory usage
yarn dev:monitor

# Restart services periodically
yarn dev:restart:all
```

## 📚 **Additional Resources**

### **Documentation**
- [API Reference](../reference/api-reference.md)
- [Configuration Guide](../reference/configuration.md)
- [Testing Guide](testing-guide.md)
- [Debugging Guide](debugging-guide.md)

### **External Resources**
- [NestJS Documentation](https://docs.nestjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [Redis Documentation](https://redis.io/documentation)

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: Development Team  
**Status**: Active
