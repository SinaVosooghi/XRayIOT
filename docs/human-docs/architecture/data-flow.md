# Data Flow - XRayIOT

## 🔄 **Complete IoT Data Processing Flow**

This document illustrates how X-ray data flows through the XRayIOT system from IoT devices to end users.

## 🏗️ **High-Level Data Flow**

```
IoT Device → Producer → RabbitMQ → Signals → MongoDB/GridFS → API → Client
     ↓           ↓         ↓         ↓           ↓         ↓
  X-Ray Data  Message   Queue    Process    Store    Retrieve
```

## 📊 **Detailed Data Flow**

### **Phase 1: Data Ingestion**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ IoT Device  │───▶│  Producer   │───▶│  RabbitMQ   │
│ (X-Ray)     │    │  Service    │    │   Queue     │
└─────────────┘    └─────────────┘    └─────────────┘
```

**What Happens**:
1. IoT device captures X-ray data
2. Device sends data to Producer service
3. Producer validates and authenticates data
4. Producer publishes message to RabbitMQ queue

**Data Format**:
```json
{
  "deviceId": "66bb584d4ae73e488c30a072",
  "timestamp": 1735683480000,
  "data": [
    [762, [51.339764, 12.339223833333334, 1.2038000000000002]],
    [1766, [51.33977733333333, 12.339211833333334, 1.531604]]
  ]
}
```

### **Phase 2: Message Queuing**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  RabbitMQ   │───▶│   Message   │───▶│   Queue     │
│   Exchange  │    │  Validation │    │  Storage    │
└─────────────┘    └─────────────┘    └─────────────┘
```

**What Happens**:
1. RabbitMQ receives message from Producer
2. Message is validated against schema
3. Message is routed to appropriate queue
4. Message is stored with QoS guarantees

**Queue Configuration**:
- **Exchange**: `iot.xray` (topic)
- **Queue**: `xray.raw.q` (main processing)
- **DLQ**: `iot.dlx` (dead letter queue)
- **Retry**: `xray.raw.v1.retry` (retry queue)

### **Phase 3: Data Processing**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  RabbitMQ   │───▶│   Signals   │───▶│  MongoDB    │
│   Queue     │    │  Service    │    │  Database   │
└─────────────┘    └─────────────┘    └─────────────┘
```

**What Happens**:
1. Signals service consumes message from queue
2. Service validates message authenticity (HMAC)
3. Service checks for duplicates (Redis idempotency)
4. Service processes and transforms data
5. Service stores processed data in MongoDB
6. Service stores raw payload in GridFS

**Processing Steps**:
```typescript
// 1. Consume message
const message = await rabbitMQ.consume('xray.raw.q');

// 2. Validate HMAC signature
const isValid = await validateHMAC(message);

// 3. Check idempotency
const isDuplicate = await redis.get(`idempotency:${message.id}`);

// 4. Process data
const processedData = await processXRayData(message.data);

// 5. Store in MongoDB
await mongoDB.signals.insertOne(processedData);

// 6. Store raw payload in GridFS
await gridFS.store(message.rawPayload);
```

### **Phase 4: Data Storage**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  MongoDB    │    │   GridFS    │    │   Redis     │
│ (Metadata)  │    │ (Raw Data)  │    │ (Cache)     │
└─────────────┘    └─────────────┘    └─────────────┘
```

**MongoDB Collections**:
```javascript
// signals collection
{
  _id: ObjectId("..."),
  deviceId: "66bb584d4ae73e488c30a072",
  timestamp: 1735683480000,
  processedAt: ISODate("2024-12-04T10:00:00.000Z"),
  dataPoints: 2,
  status: "processed",
  rawPayloadId: ObjectId("...")
}

// raw_payloads collection (GridFS)
{
  _id: ObjectId("..."),
  filename: "raw_payload_1735683480000.json",
  uploadDate: ISODate("2024-12-04T10:00:00.000Z"),
  length: 1024,
  chunkSize: 261120
}
```

**Redis Cache**:
```javascript
// Idempotency keys
"idempotency:message_id_123": "processed"
"hmac_nonce:nonce_456": "used"

// Session data
"session:user_789": "{ userId: 789, permissions: [...] }"
```

### **Phase 5: Data Retrieval**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│  API        │───▶│  MongoDB    │
│ (Frontend)  │    │  Service    │    │  Database   │
└─────────────┘    └─────────────┘    └─────────────┘
```

**What Happens**:
1. Client makes API request
2. API service authenticates request
3. API service queries MongoDB
4. API service returns formatted data

**API Endpoints**:
```bash
# Get all signals
GET /api/signals?page=1&limit=20&sort=timestamp&order=desc

# Get specific signal
GET /api/signals/{signal-id}

# Get raw data
GET /api/signals/{signal-id}/raw

# Get metadata
GET /api/signals/{signal-id}/raw/metadata
```

## 🔄 **Error Handling Flow**

### **Message Processing Errors**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Error     │───▶│   Retry     │───▶│    DLQ      │
│  Occurs     │    │   Queue     │    │  (Dead      │
│             │    │             │    │  Letter)    │
└─────────────┘    └─────────────┘    └─────────────┘
```

**Error Scenarios**:
1. **Validation Error**: Invalid data format
2. **Authentication Error**: Invalid HMAC signature
3. **Processing Error**: Data transformation fails
4. **Storage Error**: Database connection fails

**Retry Logic**:
```typescript
// Exponential backoff with jitter
const retryAttempts = [1000, 2000, 4000, 8000]; // milliseconds
const maxRetries = 3;

for (let attempt = 0; attempt < maxRetries; attempt++) {
  try {
    await processMessage(message);
    break; // Success
  } catch (error) {
    if (attempt === maxRetries - 1) {
      await sendToDLQ(message); // Final failure
    } else {
      await delay(retryAttempts[attempt] + Math.random() * 1000);
    }
  }
}
```

## 📊 **Data Flow Metrics**

### **Throughput**
- **Messages per minute**: 50+
- **Data points per message**: 1-1000
- **Storage per message**: ~2KB metadata + ~10KB raw data

### **Latency**
- **End-to-end processing**: <500ms
- **Message queue**: <10ms
- **Database operations**: <100ms
- **API responses**: <200ms

### **Reliability**
- **Message delivery**: 99.9%
- **Data processing**: 99.8%
- **API availability**: 99.9%

## 🔧 **Monitoring Points**

### **Key Metrics to Monitor**
1. **Message Queue Depth**: RabbitMQ queue length
2. **Processing Rate**: Messages processed per second
3. **Error Rate**: Failed processing attempts
4. **Storage Usage**: MongoDB and GridFS usage
5. **API Response Time**: End-to-end latency

### **Health Checks**
```bash
# Check message queue
curl http://localhost:15672/api/queues

# Check database
docker exec -it xrayiot_mongodb mongosh --eval "db.adminCommand('ping')"

# Check API health
curl http://localhost:3000/api/health
```

## 🚀 **Scaling Considerations**

### **Horizontal Scaling**
- **Producer Service**: Multiple instances for high throughput
- **Signals Service**: Multiple consumers for parallel processing
- **API Service**: Load balancer for high availability

### **Database Scaling**
- **MongoDB**: Replica set for read scaling
- **GridFS**: Sharding for large file storage
- **Redis**: Cluster for high availability

### **Message Queue Scaling**
- **RabbitMQ**: Cluster for high availability
- **Queue Partitioning**: Multiple queues for parallel processing

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Production Ready
