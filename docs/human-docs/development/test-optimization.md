# Test Optimization & Improvement Plan

## Current Test Coverage Analysis
- **Overall Coverage**: 29% (Target: >90%)
- **Test Suites**: 10 passed, 140 tests total
- **Test Time**: ~136 seconds (Target: <60 seconds)
- **Critical Gaps**: Core business logic, error handling, edge cases

## Optimization Strategy

### 1. Test Execution Optimization

#### Parallel Test Execution
```javascript
// jest.config.js optimizations
module.exports = {
  // ... existing config
  maxWorkers: '50%', // Use 50% of CPU cores
  workerIdleMemoryLimit: '512MB',
  detectOpenHandles: true,
  forceExit: true,
  
  // Test file patterns for better parallelization
  testMatch: [
    '<rootDir>/apps/**/*.spec.ts',
    '<rootDir>/libs/**/*.spec.ts'
  ],
  
  // Coverage optimization
  collectCoverageFrom: [
    'apps/**/*.ts',
    'libs/**/*.ts',
    '!**/*.spec.ts',
    '!**/*.interface.ts',
    '!**/*.dto.ts',
    '!**/main.ts',
    '!**/index.ts'
  ],
  
  // Faster test execution
  testTimeout: 10000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']
};
```

#### Test Categories
```javascript
// Separate test configurations
// jest.unit.config.js - Fast unit tests
// jest.integration.config.js - Integration tests
// jest.e2e.config.js - End-to-end tests
```

### 2. Test Coverage Improvements

#### Priority Areas for Testing
1. **Core Business Logic** (Target: 95% coverage)
   - Message processing logic
   - Data validation and transformation
   - Error handling and retry mechanisms
   - HMAC authentication and validation

2. **API Controllers** (Target: 90% coverage)
   - All endpoint handlers
   - Request/response validation
   - Error scenarios
   - Authentication and authorization

3. **Services** (Target: 85% coverage)
   - Database operations
   - Message queue operations
   - External service integrations
   - Business logic implementations

4. **Utilities** (Target: 80% coverage)
   - Helper functions
   - Validation utilities
   - Data transformation functions

#### Test Implementation Plan

##### Phase 1: Core Logic Tests (Week 1)
```typescript
// apps/signals/src/xray/xray.service.spec.ts
describe('XRayService', () => {
  describe('processXRayData', () => {
    it('should process valid x-ray data correctly', async () => {
      // Test valid data processing
    });
    
    it('should handle invalid data gracefully', async () => {
      // Test error handling
    });
    
    it('should extract location data correctly', async () => {
      // Test location extraction
    });
    
    it('should calculate statistics correctly', async () => {
      // Test statistics calculation
    });
  });
  
  describe('validateXRayData', () => {
    it('should validate correct data format', async () => {
      // Test validation logic
    });
    
    it('should reject invalid data formats', async () => {
      // Test validation errors
    });
  });
});
```

##### Phase 2: API Controller Tests (Week 2)
```typescript
// apps/api/src/signals/signals.controller.spec.ts
describe('SignalsController', () => {
  describe('GET /signals', () => {
    it('should return paginated signals', async () => {
      // Test pagination
    });
    
    it('should filter by device ID', async () => {
      // Test filtering
    });
    
    it('should handle invalid query parameters', async () => {
      // Test validation
    });
  });
  
  describe('POST /signals', () => {
    it('should create signal with valid data', async () => {
      // Test creation
    });
    
    it('should reject invalid data', async () => {
      // Test validation
    });
  });
});
```

##### Phase 3: Service Integration Tests (Week 3)
```typescript
// apps/signals/src/xray/xray.consumer.spec.ts
describe('XRayConsumer', () => {
  describe('message processing', () => {
    it('should process messages successfully', async () => {
      // Test message processing
    });
    
    it('should handle duplicate messages', async () => {
      // Test idempotency
    });
    
    it('should retry failed messages', async () => {
      // Test retry logic
    });
  });
});
```

### 3. Test Performance Optimization

#### Mock Strategy
```typescript
// jest.setup.ts
import { jest } from '@jest/globals';

// Mock external dependencies
jest.mock('@nestjs/mongoose', () => ({
  InjectModel: () => jest.fn(),
  Model: jest.fn(),
}));

jest.mock('@nestjs/microservices', () => ({
  ClientProxy: jest.fn(),
  ClientProxyFactory: {
    create: jest.fn(),
  },
}));

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  })),
}));

// Mock RabbitMQ
jest.mock('amqplib', () => ({
  connect: jest.fn(() => ({
    createChannel: jest.fn(() => ({
      assertExchange: jest.fn(),
      assertQueue: jest.fn(),
      bindQueue: jest.fn(),
      publish: jest.fn(),
      consume: jest.fn(),
      ack: jest.fn(),
      nack: jest.fn(),
    })),
    close: jest.fn(),
  })),
}));
```

#### Test Data Factories
```typescript
// test/factories/xray-data.factory.ts
export class XRayDataFactory {
  static createValidXRayData(overrides: Partial<XRayData> = {}): XRayData {
    return {
      deviceId: 'test-device-001',
      capturedAt: new Date().toISOString(),
      payload: Buffer.from(JSON.stringify({
        readings: [
          { type: 'temperature', value: 20.5, unit: 'celsius' },
          { type: 'pressure', value: 1013.25, unit: 'hPa' }
        ]
      })).toString('base64'),
      schemaVersion: 'v1',
      metadata: {
        location: {
          latitude: 51.339764,
          longitude: 12.339223833333334,
          altitude: 120.5
        },
        battery: 85,
        signalStrength: -65
      },
      correlationId: '550e8400-e29b-41d4-a716-446655440000',
      ...overrides
    };
  }
  
  static createInvalidXRayData(): Partial<XRayData> {
    return {
      deviceId: '', // Invalid device ID
      capturedAt: 'invalid-date',
      payload: 'invalid-base64',
      schemaVersion: 'invalid-version'
    };
  }
}
```

### 4. Integration Test Improvements

#### Testcontainers Setup
```typescript
// test/integration/test-setup.ts
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';

export class IntegrationTestSetup {
  private mongoServer: MongoMemoryServer;
  private mongoClient: MongoClient;
  
  async setup() {
    // Start MongoDB in memory
    this.mongoServer = await MongoMemoryServer.create();
    const mongoUri = this.mongoServer.getUri();
    
    // Connect to MongoDB
    this.mongoClient = new MongoClient(mongoUri);
    await this.mongoClient.connect();
    
    return {
      mongoUri,
      mongoClient: this.mongoClient
    };
  }
  
  async teardown() {
    await this.mongoClient.close();
    await this.mongoServer.stop();
  }
}
```

#### Database Test Utilities
```typescript
// test/utils/database.test-utils.ts
export class DatabaseTestUtils {
  static async clearCollections(client: MongoClient, collections: string[]) {
    const db = client.db();
    for (const collection of collections) {
      await db.collection(collection).deleteMany({});
    }
  }
  
  static async seedTestData(client: MongoClient, collection: string, data: any[]) {
    const db = client.db();
    await db.collection(collection).insertMany(data);
  }
}
```

### 5. E2E Test Improvements

#### E2E Test Structure
```typescript
// e2e/xray-processing.e2e-spec.ts
describe('XRay Processing E2E', () => {
  let app: INestApplication;
  let producer: ProducerService;
  let signalsService: SignalsService;
  
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
    
    producer = moduleFixture.get<ProducerService>(ProducerService);
    signalsService = moduleFixture.get<SignalsService>(SignalsService);
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  describe('End-to-End X-Ray Processing', () => {
    it('should process x-ray data from producer to API', async () => {
      // 1. Send message via producer
      const testData = XRayDataFactory.createValidXRayData();
      await producer.publishMessage(testData);
      
      // 2. Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 3. Verify data in API
      const response = await request(app.getHttpServer())
        .get('/api/signals')
        .expect(200);
      
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].deviceId).toBe(testData.deviceId);
    });
  });
});
```

### 6. Performance Test Implementation

#### Load Testing with k6
```javascript
// test/performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests under 200ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
  },
};

export default function() {
  // Test API endpoints
  let response = http.get('http://localhost:3000/api/signals');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  sleep(1);
}
```

### 7. Test Automation Scripts

#### Test Execution Scripts
```bash
#!/bin/bash
# scripts/run-tests.sh

echo "🧪 Running Test Suite..."

# Unit tests (fast)
echo "📝 Running unit tests..."
yarn test:unit --coverage --maxWorkers=50%

# Integration tests
echo "🔗 Running integration tests..."
yarn test:integration --maxWorkers=25%

# E2E tests
echo "🌐 Running E2E tests..."
yarn test:e2e --maxWorkers=1

# Performance tests
echo "⚡ Running performance tests..."
yarn test:performance

echo "✅ All tests completed!"
```

### 8. Coverage Reporting

#### Coverage Configuration
```javascript
// jest.config.js
module.exports = {
  // ... existing config
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './apps/api/src/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './apps/signals/src/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
```

### 9. Test Monitoring

#### Test Metrics
- **Coverage Trends**: Track coverage over time
- **Test Execution Time**: Monitor test performance
- **Flaky Test Detection**: Identify unstable tests
- **Test Failure Analysis**: Categorize failure types

#### Test Reports
```typescript
// test/reporting/test-reporter.ts
export class TestReporter {
  static generateCoverageReport() {
    // Generate detailed coverage report
  }
  
  static analyzeTestPerformance() {
    // Analyze test execution times
  }
  
  static identifyFlakyTests() {
    // Identify tests that fail intermittently
  }
}
```

## Implementation Timeline

### Week 1: Core Logic Tests
- [ ] Implement XRayService tests
- [ ] Add message processing tests
- [ ] Create validation tests
- [ ] Target: 60% coverage

### Week 2: API Controller Tests
- [ ] Complete SignalsController tests
- [ ] Add error handling tests
- [ ] Implement authentication tests
- [ ] Target: 75% coverage

### Week 3: Service Integration Tests
- [ ] Add consumer tests
- [ ] Implement database tests
- [ ] Create message queue tests
- [ ] Target: 85% coverage

### Week 4: E2E and Performance Tests
- [ ] Complete E2E test suite
- [ ] Add performance tests
- [ ] Optimize test execution
- [ ] Target: 90% coverage

## Success Metrics

### Coverage Targets
- **Overall Coverage**: >90%
- **Core Business Logic**: >95%
- **API Controllers**: >90%
- **Services**: >85%
- **Utilities**: >80%

### Performance Targets
- **Unit Tests**: <30 seconds
- **Integration Tests**: <60 seconds
- **E2E Tests**: <120 seconds
- **Total Test Suite**: <5 minutes

### Quality Targets
- **Zero Flaky Tests**: All tests must be deterministic
- **Fast Feedback**: Tests must provide quick feedback
- **Comprehensive Coverage**: All critical paths covered
- **Maintainable Tests**: Tests must be easy to maintain
