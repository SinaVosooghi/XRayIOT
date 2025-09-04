# Security Guide - XRayIOT

## 🔒 **Comprehensive Security Guide**

This document provides comprehensive security guidelines, best practices, and implementation details for the XRayIOT system.

## 🎯 **Security Overview**

### **Security Architecture**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│  API        │───▶│  Services   │
│ (Frontend)  │    │ Gateway     │    │ (Internal)  │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   HTTPS     │    │  Auth &     │    │  HMAC       │
│   TLS 1.3   │    │  Rate Limit │    │  Validation │
└─────────────┘    └─────────────┘    └─────────────┘
```

## 🔐 **Authentication & Authorization**

### **API Key Authentication**

#### **Implementation**
```typescript
// API key validation middleware
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    const validApiKey = this.configService.get('API_KEY');
    
    return apiKey === validApiKey;
  }
}
```

#### **Usage**
```bash
# API request with authentication
curl -H "x-api-key: your-secure-api-key" \
     http://localhost:3000/api/signals
```

#### **Security Features**
- **Header-based**: Uses `x-api-key` header
- **Rate Limiting**: 600 requests per minute per key
- **Key Rotation**: Support for key rotation
- **Audit Logging**: All API key usage logged

### **HMAC Authentication**

#### **Message Authentication**
```typescript
// HMAC signature generation
const generateHMAC = (payload: string, secret: string, timestamp: number, nonce: string): string => {
  const message = `${timestamp}${nonce}${payload}`;
  return crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('base64');
};

// HMAC signature verification
const verifyHMAC = (signature: string, payload: string, secret: string, timestamp: number, nonce: string): boolean => {
  const expectedSignature = generateHMAC(payload, secret, timestamp, nonce);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'base64'),
    Buffer.from(expectedSignature, 'base64')
  );
};
```

#### **Nonce Replay Protection**
```typescript
// Nonce validation
const validateNonce = async (nonce: string): Promise<boolean> => {
  const key = `hmac_nonce:${nonce}`;
  const exists = await redis.exists(key);
  
  if (exists) {
    return false; // Nonce already used
  }
  
  // Store nonce with TTL
  await redis.setex(key, 300, 'used');
  return true;
};
```

## 🛡️ **Input Validation & Sanitization**

### **Request Validation**

#### **DTO Validation**
```typescript
// Signal creation DTO
export class CreateSignalDto {
  @IsString()
  @IsNotEmpty()
  @Length(24, 24)
  deviceId: string;

  @IsNumber()
  @IsPositive()
  timestamp: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DataPointDto)
  data: DataPointDto[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MetadataDto)
  metadata?: MetadataDto;
}

// Data point validation
export class DataPointDto {
  @IsNumber()
  @IsPositive()
  time: number;

  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @IsNumber({}, { each: true })
  coordinates: number[];
}
```

#### **Schema Validation**
```typescript
// JSON Schema validation
const signalSchema = {
  type: 'object',
  required: ['deviceId', 'timestamp', 'data'],
  properties: {
    deviceId: {
      type: 'string',
      pattern: '^[a-f0-9]{24}$'
    },
    timestamp: {
      type: 'number',
      minimum: 0
    },
    data: {
      type: 'array',
      items: {
        type: 'array',
        items: [
          { type: 'number' },
          { type: 'array', items: { type: 'number' } }
        ]
      }
    }
  }
};
```

### **SQL Injection Prevention**

#### **MongoDB Query Safety**
```typescript
// Safe query construction
const findSignals = async (filters: SignalFilters) => {
  const query: any = {};
  
  if (filters.deviceId) {
    query.deviceId = filters.deviceId; // Direct assignment, no concatenation
  }
  
  if (filters.startDate && filters.endDate) {
    query.timestamp = {
      $gte: filters.startDate,
      $lte: filters.endDate
    };
  }
  
  return await this.signalModel.find(query);
};
```

## 🚦 **Rate Limiting & DDoS Protection**

### **Rate Limiting Implementation**

#### **API Rate Limiting**
```typescript
// Rate limiting middleware
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private redis: Redis) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    const key = `rate_limit:${apiKey}`;
    
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, 60); // 1 minute window
    }
    
    return current <= 600; // 600 requests per minute
  }
}
```

#### **IP-based Rate Limiting**
```typescript
// IP rate limiting
const ipRateLimit = async (ip: string): Promise<boolean> => {
  const key = `ip_rate_limit:${ip}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, 60);
  }
  
  return current <= 100; // 100 requests per minute per IP
};
```

### **DDoS Protection**

#### **Request Throttling**
```typescript
// Request throttling
const throttleRequests = async (identifier: string): Promise<boolean> => {
  const key = `throttle:${identifier}`;
  const current = await redis.incr(key);
  
  if (current > 10) { // 10 requests per second
    return false;
  }
  
  if (current === 1) {
    await redis.expire(key, 1);
  }
  
  return true;
};
```

## 🔒 **Data Encryption**

### **Encryption at Rest**

#### **MongoDB Encryption**
```yaml
# MongoDB encryption configuration
security:
  enableEncryption: true
  encryptionKeyFile: /etc/mongodb/encryption.key
  encryptionAlgorithm: AES256-CBC
```

#### **Redis Encryption**
```yaml
# Redis encryption configuration
tls:
  enabled: true
  cert-file: /etc/redis/tls/redis.crt
  key-file: /etc/redis/tls/redis.key
  ca-file: /etc/redis/tls/ca.crt
```

### **Encryption in Transit**

#### **TLS Configuration**
```nginx
# Nginx TLS configuration
server {
    listen 443 ssl http2;
    ssl_certificate /etc/ssl/certs/xrayiot.crt;
    ssl_certificate_key /etc/ssl/private/xrayiot.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
}
```

#### **Service-to-Service Encryption**
```typescript
// RabbitMQ TLS configuration
const rabbitmqConfig = {
  uri: 'amqps://admin:password@localhost:5671',
  options: {
    ca: fs.readFileSync('/etc/ssl/certs/ca.crt'),
    cert: fs.readFileSync('/etc/ssl/certs/client.crt'),
    key: fs.readFileSync('/etc/ssl/private/client.key'),
  }
};
```

## 🛡️ **Security Headers**

### **HTTP Security Headers**

#### **Nginx Security Headers**
```nginx
# Security headers
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Content-Security-Policy "default-src 'self'";
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()";
```

#### **Application Security Headers**
```typescript
// Security headers middleware
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  }
}
```

## 🔍 **Audit Logging**

### **Security Event Logging**

#### **Authentication Events**
```typescript
// Authentication logging
const logAuthEvent = (event: string, details: any) => {
  logger.info({
    event: 'authentication',
    type: event,
    timestamp: new Date().toISOString(),
    details,
    correlationId: req.correlationId
  });
};

// Usage
logAuthEvent('api_key_used', {
  apiKey: apiKey.substring(0, 8) + '...',
  ip: req.ip,
  userAgent: req.get('User-Agent')
});
```

#### **Authorization Events**
```typescript
// Authorization logging
const logAuthzEvent = (event: string, details: any) => {
  logger.warn({
    event: 'authorization',
    type: event,
    timestamp: new Date().toISOString(),
    details,
    correlationId: req.correlationId
  });
};

// Usage
logAuthzEvent('access_denied', {
  resource: req.path,
  method: req.method,
  ip: req.ip
});
```

### **Data Access Logging**

#### **Database Access Logs**
```typescript
// Database access logging
const logDbAccess = (operation: string, collection: string, query: any) => {
  logger.info({
    event: 'database_access',
    operation,
    collection,
    query: sanitizeQuery(query),
    timestamp: new Date().toISOString()
  });
};
```

## 🚨 **Security Monitoring**

### **Intrusion Detection**

#### **Suspicious Activity Detection**
```typescript
// Suspicious activity detection
const detectSuspiciousActivity = async (ip: string, apiKey: string) => {
  const patterns = [
    'multiple_failed_attempts',
    'unusual_request_patterns',
    'high_frequency_requests',
    'suspicious_user_agents'
  ];
  
  for (const pattern of patterns) {
    const score = await analyzePattern(pattern, ip, apiKey);
    if (score > threshold) {
      await alertSecurityTeam(pattern, ip, apiKey, score);
    }
  }
};
```

#### **Anomaly Detection**
```typescript
// Anomaly detection
const detectAnomalies = async (metrics: SystemMetrics) => {
  const anomalies = [];
  
  // High error rate
  if (metrics.errorRate > 0.1) {
    anomalies.push('high_error_rate');
  }
  
  // Unusual traffic pattern
  if (metrics.requestRate > baseline * 2) {
    anomalies.push('unusual_traffic');
  }
  
  // High response time
  if (metrics.avgResponseTime > 1000) {
    anomalies.push('high_response_time');
  }
  
  return anomalies;
};
```

### **Security Alerts**

#### **Alert Configuration**
```yaml
# Security alert rules
security_alerts:
  - name: "Multiple Failed Auth Attempts"
    condition: "failed_auth_attempts > 5 in 5m"
    severity: "high"
    action: "block_ip"
  
  - name: "Suspicious Request Pattern"
    condition: "unusual_requests > 10 in 1m"
    severity: "medium"
    action: "rate_limit"
  
  - name: "Data Exfiltration Attempt"
    condition: "large_data_requests > 3 in 1m"
    severity: "critical"
    action: "block_and_alert"
```

## 🔐 **Secrets Management**

### **Environment Variables**

#### **Secure Secret Storage**
```bash
# Use environment variables for secrets
export API_KEY="$(openssl rand -base64 32)"
export HMAC_SECRET="$(openssl rand -base64 32)"
export MONGO_PASSWORD="$(openssl rand -base64 16)"
export RABBITMQ_PASSWORD="$(openssl rand -base64 16)"
```

#### **Secret Rotation**
```typescript
// Secret rotation
const rotateSecrets = async () => {
  const newApiKey = generateSecureKey();
  const newHmacSecret = generateSecureKey();
  
  // Update in secure store
  await updateSecret('API_KEY', newApiKey);
  await updateSecret('HMAC_SECRET', newHmacSecret);
  
  // Notify services to reload
  await notifyServices('secrets_rotated');
};
```

### **Key Management**

#### **Key Generation**
```typescript
// Secure key generation
const generateSecureKey = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('base64');
};

// HMAC key generation
const generateHMACKey = (): string => {
  return crypto.randomBytes(64).toString('hex');
};
```

## 🛠️ **Security Testing**

### **Penetration Testing**

#### **API Security Tests**
```typescript
// API security test suite
describe('API Security', () => {
  it('should reject requests without API key', async () => {
    const response = await request(app)
      .get('/api/signals')
      .expect(401);
    
    expect(response.body.error).toBe('API key required');
  });
  
  it('should reject requests with invalid API key', async () => {
    const response = await request(app)
      .get('/api/signals')
      .set('x-api-key', 'invalid-key')
      .expect(401);
    
    expect(response.body.error).toBe('Invalid API key');
  });
  
  it('should enforce rate limiting', async () => {
    const promises = Array(700).fill(null).map(() =>
      request(app)
        .get('/api/signals')
        .set('x-api-key', 'valid-key')
    );
    
    const responses = await Promise.all(promises);
    const rateLimited = responses.filter(r => r.status === 429);
    
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

### **Vulnerability Scanning**

#### **Dependency Scanning**
```bash
# Scan for vulnerabilities
yarn audit --level moderate

# Fix vulnerabilities
yarn audit fix

# Check for security issues
npm audit --audit-level moderate
```

#### **Container Security Scanning**
```bash
# Scan Docker images
trivy image xrayiot/api:latest

# Scan for critical vulnerabilities
trivy image --severity CRITICAL xrayiot/api:latest
```

## 📋 **Security Checklist**

### **Pre-deployment Security**
- [ ] All secrets are properly managed
- [ ] TLS/SSL certificates are valid
- [ ] Security headers are configured
- [ ] Rate limiting is enabled
- [ ] Input validation is comprehensive
- [ ] Audit logging is enabled
- [ ] Dependencies are up to date
- [ ] Security tests pass

### **Runtime Security**
- [ ] Monitor for suspicious activity
- [ ] Review security logs regularly
- [ ] Update security patches promptly
- [ ] Rotate secrets periodically
- [ ] Monitor system metrics
- [ ] Check for anomalies
- [ ] Verify backup security
- [ ] Test incident response

### **Post-incident Security**
- [ ] Analyze security logs
- [ ] Identify attack vectors
- [ ] Update security measures
- [ ] Patch vulnerabilities
- [ ] Review access controls
- [ ] Update documentation
- [ ] Conduct security training
- [ ] Test security improvements

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Production Ready
