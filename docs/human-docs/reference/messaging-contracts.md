# XRayIOT Messaging Contracts Specification

## Overview
This document defines the complete messaging contracts for the XRayIOT system, including RabbitMQ topology, message schemas, routing, and quality of service (QoS) specifications.

## RabbitMQ Topology

### Exchanges
- **Primary Exchange**: `iot.xray` (topic)
- **Dead Letter Exchange**: `iot.xray.dlx` (direct)

### Queues
- **Main Queue**: `xray.raw.v1`
- **Dead Letter Queue**: `xray.raw.v1.dlq`
- **Retry Queue**: `xray.raw.v1.retry`

### Routing Keys
- **Main Routing Key**: `xray.raw.v1`
- **DLQ Routing Key**: `xray.raw.v1.dlq`
- **Retry Routing Key**: `xray.raw.v1.retry`

---

## Message Schemas

### Raw X-Ray Signal Message
```json
{
  "deviceId": "device-123",
  "capturedAt": "2024-01-01T00:00:00.000Z",
  "payload": "base64-encoded-payload",
  "schemaVersion": "v1",
  "metadata": {
    "location": {
      "latitude": 51.339764,
      "longitude": 12.339223833333334,
      "altitude": 120.5
    },
    "battery": 85,
    "signalStrength": -65
  },
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Processed X-Ray Signal Message
```json
{
  "deviceId": "device-123",
  "processedAt": "2024-01-01T00:00:00.000Z",
  "originalPayload": "base64-encoded-payload",
  "processedData": {
    "readings": [
      {
        "type": "temperature",
        "value": 20.5,
        "unit": "celsius",
        "confidence": 0.95
      }
    ],
    "anomalies": [
      {
        "type": "temperature_spike",
        "severity": "low",
        "description": "Temperature reading above normal range"
      }
    ]
  },
  "schemaVersion": "v1",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Device Status Update Message
```json
{
  "deviceId": "device-123",
  "status": "online",
  "lastSeen": "2024-01-01T00:00:00.000Z",
  "health": {
    "battery": 85,
    "signalStrength": -65,
    "temperature": 25.5,
    "uptime": 86400
  },
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Message Properties

### Required Headers
- `content-type`: `application/json`
- `x-correlation-id`: UUID v4 correlation ID
- `x-schema-version`: Schema version (e.g., "v1")
- `x-timestamp`: Message timestamp (ISO 8601)

### Optional Headers
- `x-device-id`: Device identifier
- `x-retry-count`: Number of retry attempts
- `x-idempotency-key`: Idempotency key for duplicate prevention

---

## Quality of Service (QoS)

### Connection Settings
- **Heartbeat**: 30 seconds
- **Connection Timeout**: 5 seconds
- **Prefetch Count**: 50 messages

### Message TTL
- **Main Queue**: 1 hour (3,600,000 ms)
- **Retry Queue**: 1 minute (60,000 ms)
- **DLQ**: 7 days (604,800,000 ms)

### Retry Policy
- **Max Retries**: 3 attempts
- **Backoff Strategy**: Exponential backoff
- **Initial Delay**: 1 second
- **Max Delay**: 30 seconds
- **Jitter**: ±25% random variation

---

## Message Flow

### 1. Message Publishing
```
Producer → iot.xray (topic) → xray.raw.v1 (queue)
```

### 2. Message Processing
```
Consumer ← xray.raw.v1 (queue)
```

### 3. Retry Flow
```
Failed Message → iot.xray.dlx (direct) → xray.raw.v1.retry (queue)
After TTL → iot.xray (topic) → xray.raw.v1 (queue)
```

### 4. Dead Letter Flow
```
Max Retries Exceeded → iot.xray.dlx (direct) → xray.raw.v1.dlq (queue)
```

---

## Message Validation

### Schema Validation
All messages must conform to their respective JSON schemas:
- **Raw Signal**: `xray.raw.v1` schema
- **Processed Signal**: `xray.processed.v1` schema
- **Device Status**: `device.status.v1` schema

### Field Validation
- **deviceId**: Required, alphanumeric with hyphens/underscores, 1-100 chars
- **capturedAt**: Required, ISO 8601 timestamp
- **payload**: Required, base64 encoded string, max 1MB
- **schemaVersion**: Required, must be "v1" or "v2"
- **correlationId**: Optional, UUID v4 format

---

## Error Handling

### Message Rejection
Messages are rejected and sent to DLQ for:
- Schema validation failures
- Malformed JSON
- Missing required fields
- Invalid field values
- Processing errors after max retries

### Error Response Format
```json
{
  "error": {
    "code": "PROCESSING_ERROR",
    "message": "Failed to process message",
    "details": "Specific error details",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "correlationId": "550e8400-e29b-41d4-a716-446655440000",
    "retryCount": 3
  }
}
```

---

## Idempotency

### Idempotency Key Generation
```javascript
const idempotencyKey = generateIdempotencyKey({
  deviceId: message.deviceId,
  capturedAt: message.capturedAt,
  payload: message.payload
});
```

### Duplicate Detection
- Messages with the same idempotency key are considered duplicates
- Duplicates are acknowledged but not processed
- Idempotency keys are stored in Redis with TTL of 15 minutes

---

## Monitoring and Observability

### Metrics
- **Message Throughput**: Messages per second
- **Processing Latency**: Average processing time
- **Error Rate**: Percentage of failed messages
- **Queue Depth**: Number of messages in queue
- **DLQ Depth**: Number of messages in dead letter queue

### Logging
All message processing events are logged with:
- Correlation ID
- Device ID
- Processing status
- Error details (if applicable)
- Processing duration

---

## Security

### Message Authentication
- **HMAC Signature**: All messages include HMAC signature
- **Algorithm**: SHA-256
- **Secret Key**: Configurable per environment
- **Timestamp Validation**: 5-minute tolerance window
- **Nonce Replay Protection**: Nonce tracking in Redis

### Message Encryption
- **Transport**: TLS 1.2+ for RabbitMQ connections
- **At Rest**: Messages stored encrypted in MongoDB
- **Key Management**: Rotating keys with configurable intervals

---

## Configuration

### Environment Variables
```bash
# RabbitMQ Configuration
RABBITMQ_URI=amqp://admin:password@localhost:5672
RABBITMQ_EXCHANGE=iot.xray
RABBITMQ_QUEUE=xray.raw.v1
RABBITMQ_DLX=iot.xray.dlx
RABBITMQ_HEARTBEAT=30
RABBITMQ_PREFETCH=50
RABBITMQ_RETRY_MAX=3
RABBITMQ_CONNECTION_TIMEOUT=5000

# Redis Configuration (Idempotency)
REDIS_URI=redis://localhost:6379
IDEMP_TTL_SEC=900

# HMAC Configuration
HMAC_SECRET_KEY=your-secret-key
HMAC_ALGORITHM=sha256
HMAC_TIMESTAMP_TOLERANCE=300
HMAC_NONCE_LENGTH=16
HMAC_NONCE_TTL=3600
```

---

## Testing

### Message Testing
```javascript
// Test message publishing
const testMessage = {
  deviceId: "test-device-001",
  capturedAt: new Date().toISOString(),
  payload: Buffer.from(JSON.stringify(testData)).toString('base64'),
  schemaVersion: "v1",
  correlationId: generateUUID()
};

await publishMessage(testMessage);
```

### Schema Validation Testing
```javascript
// Test schema validation
const isValid = validateMessage(testMessage, 'xray.raw.v1');
expect(isValid).toBe(true);
```

### Error Handling Testing
```javascript
// Test error handling
const invalidMessage = { invalid: "data" };
await expect(processMessage(invalidMessage)).rejects.toThrow();
```

---

## Performance Considerations

### Message Size Limits
- **Maximum Payload**: 1MB
- **Recommended Payload**: <100KB
- **Compression**: Gzip compression for large payloads

### Throughput Targets
- **Target Throughput**: 1000 messages/second
- **Peak Throughput**: 5000 messages/second
- **Latency Target**: <100ms average processing time

### Scaling
- **Horizontal Scaling**: Multiple consumer instances
- **Queue Partitioning**: By device ID for high-volume devices
- **Load Balancing**: Round-robin message distribution

---

## Migration and Versioning

### Schema Versioning
- **Current Version**: v1
- **Backward Compatibility**: Maintained for 2 versions
- **Migration Strategy**: Gradual rollout with feature flags

### Breaking Changes
Breaking changes require:
- New schema version
- New queue name
- Migration plan for existing messages
- Rollback strategy

---

## Examples

### Publishing a Message
```javascript
const message = {
  deviceId: "device-123",
  capturedAt: "2024-01-01T00:00:00.000Z",
  payload: Buffer.from(JSON.stringify(xrayData)).toString('base64'),
  schemaVersion: "v1",
  metadata: {
    location: {
      latitude: 51.339764,
      longitude: 12.339223833333334,
      altitude: 120.5
    },
    battery: 85,
    signalStrength: -65
  },
  correlationId: generateUUID()
};

await channel.publish('iot.xray', 'xray.raw.v1', Buffer.from(JSON.stringify(message)), {
  persistent: true,
  headers: {
    'content-type': 'application/json',
    'x-correlation-id': message.correlationId,
    'x-schema-version': message.schemaVersion,
    'x-timestamp': new Date().toISOString()
  }
});
```

### Consuming Messages
```javascript
await channel.consume('xray.raw.v1', async (msg) => {
  try {
    const message = JSON.parse(msg.content.toString());
    
    // Validate message
    const isValid = validateMessage(message, 'xray.raw.v1');
    if (!isValid) {
      throw new Error('Invalid message schema');
    }
    
    // Process message
    await processXRayMessage(message);
    
    // Acknowledge message
    channel.ack(msg);
  } catch (error) {
    // Handle error and potentially retry
    await handleMessageError(msg, error);
  }
});
```
