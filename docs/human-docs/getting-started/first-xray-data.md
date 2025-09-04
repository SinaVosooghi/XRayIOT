# First X-Ray Data - XRayIOT

## 🎯 **Process Your First X-Ray Data**

This guide will walk you through processing your first X-ray data using the XRayIOT system.

## 📋 **Prerequisites**

- XRayIOT system running (see [Quick Start Guide](quick-start.md))
- Sample data file (we'll provide one)
- Basic understanding of the system architecture

## 🚀 **Step-by-Step Guide**

### **Step 1: Prepare Sample Data**

Create a sample X-ray data file:

```json
{
  "deviceId": "66bb584d4ae73e488c30a072",
  "timestamp": 1735683480000,
  "data": [
    [762, [51.339764, 12.339223833333334, 1.2038000000000002]],
    [1766, [51.33977733333333, 12.339211833333334, 1.531604]]
  ],
  "metadata": {
    "deviceType": "xray-scanner",
    "version": "1.0",
    "location": "hospital-ward-1"
  }
}
```

### **Step 2: Start the System**

```bash
# Start infrastructure
yarn infra:up

# Start services
yarn dev:api        # Terminal 1
yarn dev:signals    # Terminal 2
yarn dev:producer   # Terminal 3
```

### **Step 3: Send Data to Producer**

```bash
# Send sample data
curl -X POST http://localhost:3001/generate-test-data \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "66bb584d4ae73e488c30a072",
    "timestamp": 1735683480000,
    "data": [
      [762, [51.339764, 12.339223833333334, 1.2038000000000002]],
      [1766, [51.33977733333333, 12.339211833333334, 1.531604]]
    ]
  }'
```

### **Step 4: Verify Data Processing**

```bash
# Check if data was processed
curl http://localhost:3000/api/signals

# Expected response:
# [
#   {
#     "id": "...",
#     "deviceId": "66bb584d4ae73e488c30a072",
#     "timestamp": 1735683480000,
#     "processedAt": "2024-12-04T10:00:00.000Z",
#     "dataPoints": 2,
#     "status": "processed"
#   }
# ]
```

### **Step 5: Retrieve Raw Data**

```bash
# Get raw payload
curl http://localhost:3000/api/signals/{signal-id}/raw

# Get metadata
curl http://localhost:3000/api/signals/{signal-id}/raw/metadata
```

## 🔍 **Understanding the Data Flow**

### **1. Data Ingestion**
```
Sample Data → Producer Service → RabbitMQ Queue
```

### **2. Data Processing**
```
RabbitMQ Queue → Signals Service → MongoDB + GridFS
```

### **3. Data Retrieval**
```
Client → API Service → MongoDB → Client
```

## 📊 **Data Structure Explanation**

### **Input Data Format**
```json
{
  "deviceId": "string",           // Unique device identifier
  "timestamp": "number",          // Unix timestamp (milliseconds)
  "data": [                       // Array of data points
    [time, [x, y, value]],        // [relative_time, [x_coord, y_coord, measurement]]
    [time, [x, y, value]]
  ],
  "metadata": {                   // Optional metadata
    "deviceType": "string",
    "version": "string",
    "location": "string"
  }
}
```

### **Processed Data Format**
```json
{
  "id": "string",                 // Unique signal ID
  "deviceId": "string",           // Device identifier
  "timestamp": "number",          // Original timestamp
  "processedAt": "string",        // Processing timestamp (ISO 8601)
  "dataPoints": "number",         // Number of data points
  "status": "string",             // Processing status
  "rawPayloadId": "string"        // GridFS file ID for raw data
}
```

## 🧪 **Testing Your Data**

### **Unit Test Example**
```typescript
describe('X-Ray Data Processing', () => {
  it('should process sample X-ray data', async () => {
    const sampleData = {
      deviceId: 'test-device',
      timestamp: Date.now(),
      data: [[100, [1.0, 2.0, 3.0]]]
    };

    const result = await producerService.processData(sampleData);
    expect(result.status).toBe('processed');
    expect(result.dataPoints).toBe(1);
  });
});
```

### **Integration Test Example**
```typescript
describe('X-Ray Data Flow', () => {
  it('should process data end-to-end', async () => {
    // Send data to producer
    await producerService.sendData(sampleData);
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify data in API
    const response = await apiService.getSignals();
    expect(response.data).toHaveLength(1);
    expect(response.data[0].deviceId).toBe('test-device');
  });
});
```

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Data Not Processing**
```bash
# Check RabbitMQ queue
curl http://localhost:15672/api/queues

# Check Signals service logs
docker logs xrayiot_signals
```

#### **API Not Returning Data**
```bash
# Check MongoDB connection
docker exec -it xrayiot_mongodb mongosh --eval "db.signals.find().limit(1)"

# Check API service logs
docker logs xrayiot_api
```

#### **Producer Not Sending Data**
```bash
# Check Producer service logs
docker logs xrayiot_producer

# Test producer health
curl http://localhost:3001/health
```

## 📈 **Next Steps**

Now that you've processed your first X-ray data:

1. **Explore the API**: Check out the [API Reference](../reference/api-reference.md)
2. **Learn the Architecture**: Read the [System Overview](../architecture/system-overview.md)
3. **Set up Development**: Follow the [Local Setup Guide](../development/local-setup.md)
4. **Run Tests**: Try `yarn test` to run the test suite

## 🎉 **Congratulations!**

You've successfully processed your first X-ray data through the XRayIOT system! The data has been:

- ✅ **Ingested** by the Producer service
- ✅ **Queued** in RabbitMQ
- ✅ **Processed** by the Signals service
- ✅ **Stored** in MongoDB and GridFS
- ✅ **Retrieved** via the API service

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Ready to Use
