# XRayIOT API Specification

## Overview
This document defines the complete API specification for the XRayIOT system, including endpoints, request/response schemas, error handling, and security requirements.

## Base URL
- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.xrayiot.com/api`

## Authentication
All API endpoints require authentication via API key in the request header:
```
X-API-Key: your-api-key-here
```

## Rate Limiting
- **Default**: 600 requests per minute per API key
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests per minute
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets (Unix timestamp)

## Error Response Format
All errors follow a consistent format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "correlationId": "uuid-v4-correlation-id"
  }
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (missing/invalid API key)
- `403` - Forbidden (rate limit exceeded)
- `404` - Not Found
- `422` - Unprocessable Entity (validation errors)
- `500` - Internal Server Error

---

## Endpoints

### Health Check

#### GET /health
Check system health and dependencies.

**Response:**
```json
{
  "status": "ok",
  "info": {
    "mongo": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "mongo": {
      "status": "up"
    }
  }
}
```

---

### Signals Management

#### GET /signals
Retrieve signals with pagination and filtering.

**Query Parameters:**
- `deviceId` (string, optional): Filter by device ID
- `from` (string, optional): Start time filter (ISO 8601)
- `to` (string, optional): End time filter (ISO 8601)
- `limit` (number, optional): Number of results (1-100, default: 20)
- `skip` (number, optional): Number of results to skip (default: 0)
- `cursor` (string, optional): Cursor for pagination
- `fields` (string, optional): Comma-separated fields to return
- `minLat` (number, optional): Minimum latitude
- `maxLat` (number, optional): Maximum latitude
- `minLon` (number, optional): Minimum longitude
- `maxLon` (number, optional): Maximum longitude
- `minSpeed` (number, optional): Minimum speed
- `maxSpeed` (number, optional): Maximum speed

**Response:**
```json
{
  "data": [
    {
      "id": "signal-id",
      "deviceId": "device-123",
      "time": "2024-01-01T00:00:00.000Z",
      "dataLength": 100,
      "dataVolume": 1024,
      "location": {
        "type": "Point",
        "coordinates": [12.34, 56.78]
      },
      "stats": {
        "maxSpeed": 25.5,
        "avgSpeed": 15.2,
        "distanceMeters": 1000,
        "bbox": {
          "minLat": 12.30,
          "maxLat": 12.40,
          "minLon": 56.70,
          "maxLon": 56.80
        }
      },
      "rawRef": "gridfs-reference",
      "rawHash": "sha256-hash",
      "rawSizeBytes": 1024,
      "idempotencyKey": "idempotency-key",
      "ingestedAt": "2024-01-01T00:00:00.000Z",
      "status": "processed"
    }
  ],
  "pagination": {
    "total": 1000,
    "limit": 20,
    "skip": 0,
    "hasMore": true,
    "nextCursor": "cursor-string"
  }
}
```

#### GET /signals/:id
Retrieve a specific signal by ID.

**Path Parameters:**
- `id` (string, required): Signal ID

**Response:**
```json
{
  "id": "signal-id",
  "deviceId": "device-123",
  "time": "2024-01-01T00:00:00.000Z",
  "dataLength": 100,
  "dataVolume": 1024,
  "location": {
    "type": "Point",
    "coordinates": [12.34, 56.78]
  },
  "stats": {
    "maxSpeed": 25.5,
    "avgSpeed": 15.2,
    "distanceMeters": 1000,
    "bbox": {
      "minLat": 12.30,
      "maxLat": 12.40,
      "minLon": 56.70,
      "maxLon": 56.80
    }
  },
  "rawRef": "gridfs-reference",
  "rawHash": "sha256-hash",
  "rawSizeBytes": 1024,
  "idempotencyKey": "idempotency-key",
  "ingestedAt": "2024-01-01T00:00:00.000Z",
  "status": "processed"
}
```

#### GET /signals/:id/raw
Retrieve raw data for a specific signal.

**Path Parameters:**
- `id` (string, required): Signal ID

**Response:**
```json
{
  "rawData": "base64-encoded-raw-data",
  "metadata": {
    "contentType": "application/json",
    "size": 1024,
    "checksum": "sha256-hash"
  }
}
```

#### GET /signals/:id/raw/metadata
Retrieve metadata for raw data of a specific signal.

**Path Parameters:**
- `id` (string, required): Signal ID

**Response:**
```json
{
  "metadata": {
    "contentType": "application/json",
    "size": 1024,
    "checksum": "sha256-hash",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastModified": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /signals
Create a new signal.

**Request Body:**
```json
{
  "deviceId": "device-123",
  "data": [
    {
      "timestamp": 762,
      "lat": 51.339764,
      "lon": 12.339223833333334,
      "speed": 1.2038000000000002
    }
  ],
  "time": 1735683480000
}
```

**Response:**
```json
{
  "id": "signal-id",
  "deviceId": "device-123",
  "time": "2024-01-01T00:00:00.000Z",
  "dataLength": 1,
  "dataVolume": 1024,
  "location": {
    "type": "Point",
    "coordinates": [12.34, 56.78]
  },
  "stats": {
    "maxSpeed": 1.2,
    "avgSpeed": 1.2,
    "distanceMeters": 0,
    "bbox": {
      "minLat": 51.339764,
      "maxLat": 51.339764,
      "minLon": 12.339223833333334,
      "maxLon": 12.339223833333334
    }
  },
  "rawRef": "gridfs-reference",
  "rawHash": "sha256-hash",
  "rawSizeBytes": 1024,
  "idempotencyKey": "idempotency-key",
  "ingestedAt": "2024-01-01T00:00:00.000Z",
  "status": "processed"
}
```

#### PATCH /signals/:id
Update an existing signal.

**Path Parameters:**
- `id` (string, required): Signal ID

**Request Body:**
```json
{
  "status": "processed"
}
```

**Response:**
```json
{
  "id": "signal-id",
  "deviceId": "device-123",
  "time": "2024-01-01T00:00:00.000Z",
  "dataLength": 100,
  "dataVolume": 1024,
  "location": {
    "type": "Point",
    "coordinates": [12.34, 56.78]
  },
  "stats": {
    "maxSpeed": 25.5,
    "avgSpeed": 15.2,
    "distanceMeters": 1000,
    "bbox": {
      "minLat": 12.30,
      "maxLat": 12.40,
      "minLon": 56.70,
      "maxLon": 56.80
    }
  },
  "rawRef": "gridfs-reference",
  "rawHash": "sha256-hash",
  "rawSizeBytes": 1024,
  "idempotencyKey": "idempotency-key",
  "ingestedAt": "2024-01-01T00:00:00.000Z",
  "status": "processed"
}
```

#### DELETE /signals/:id
Delete a specific signal.

**Path Parameters:**
- `id` (string, required): Signal ID

**Response:**
```json
{
  "message": "Signal deleted successfully",
  "id": "signal-id"
}
```

---

### Analytics Endpoints

#### GET /signals/analytics/device-stats
Get statistics for devices.

**Query Parameters:**
- `deviceId` (string, optional): Filter by device ID
- `from` (string, optional): Start time filter (ISO 8601)
- `to` (string, optional): End time filter (ISO 8601)

**Response:**
```json
{
  "deviceStats": [
    {
      "deviceId": "device-123",
      "totalSignals": 1000,
      "totalDataPoints": 50000,
      "avgSpeed": 15.2,
      "maxSpeed": 45.5,
      "totalDistance": 10000,
      "timeRange": {
        "from": "2024-01-01T00:00:00.000Z",
        "to": "2024-01-31T23:59:59.999Z"
      }
    }
  ]
}
```

#### GET /signals/analytics/location-clusters
Get location clusters for signals.

**Query Parameters:**
- `deviceId` (string, optional): Filter by device ID
- `from` (string, optional): Start time filter (ISO 8601)
- `to` (string, optional): End time filter (ISO 8601)
- `clusterRadius` (number, optional): Cluster radius in meters (default: 1000)

**Response:**
```json
{
  "clusters": [
    {
      "center": {
        "lat": 51.339764,
        "lon": 12.339223833333334
      },
      "radius": 1000,
      "signalCount": 50,
      "deviceIds": ["device-123", "device-456"]
    }
  ]
}
```

#### GET /signals/analytics/time-trends
Get time-based trends for signals.

**Query Parameters:**
- `deviceId` (string, optional): Filter by device ID
- `from` (string, optional): Start time filter (ISO 8601)
- `to` (string, optional): End time filter (ISO 8601)
- `granularity` (string, optional): Time granularity (hour, day, week, month)

**Response:**
```json
{
  "trends": [
    {
      "timestamp": "2024-01-01T00:00:00.000Z",
      "signalCount": 100,
      "avgSpeed": 15.2,
      "maxSpeed": 25.5,
      "totalDistance": 1000
    }
  ]
}
```

---

### Storage Endpoints

#### GET /signals/storage/stats
Get storage statistics.

**Response:**
```json
{
  "storage": {
    "totalSize": 1073741824,
    "totalFiles": 1000,
    "avgFileSize": 1073741,
    "oldestFile": "2024-01-01T00:00:00.000Z",
    "newestFile": "2024-01-31T23:59:59.999Z"
  }
}
```

---

## Data Models

### Signal
```typescript
interface Signal {
  id: string;
  deviceId: string;
  time: string; // ISO 8601 timestamp
  dataLength: number;
  dataVolume: number;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  stats?: {
    maxSpeed: number;
    avgSpeed: number;
    distanceMeters: number;
    bbox: {
      minLat: number;
      maxLat: number;
      minLon: number;
      maxLon: number;
    };
  };
  rawRef?: string;
  rawHash?: string;
  rawSizeBytes?: number;
  idempotencyKey?: string;
  ingestedAt: string; // ISO 8601 timestamp
  status: "processed" | "failed" | "pending";
}
```

### DataPoint
```typescript
interface DataPoint {
  timestamp: number; // Relative timestamp in milliseconds
  lat: number; // Latitude in decimal degrees
  lon: number; // Longitude in decimal degrees
  speed: number; // Speed in meters per second
}
```

### CreateSignalRequest
```typescript
interface CreateSignalRequest {
  deviceId: string;
  data: DataPoint[];
  time: number; // Unix timestamp in milliseconds
}
```

---

## Validation Rules

### Device ID
- Required: Yes
- Pattern: `^[a-zA-Z0-9_-]+$`
- Min Length: 1
- Max Length: 100

### Coordinates
- Latitude: -90 to 90 (decimal degrees)
- Longitude: -180 to 180 (decimal degrees)

### Speed
- Min: 0 (meters per second)
- Max: 1000 (meters per second)

### Timestamps
- Format: Unix timestamp in milliseconds or ISO 8601 string
- Must be valid date/time

### Pagination
- Limit: 1-100 (default: 20)
- Skip: 0 or positive integer (default: 0)

---

## Security

### API Key Authentication
- Header: `X-API-Key`
- Format: String
- Required for all endpoints except `/health`

### Rate Limiting
- Default: 600 requests per minute
- Configurable per API key
- Headers included in response

### CORS
- Configurable origins
- Credentials support configurable

---

## Examples

### Create Signal
```bash
curl -X POST http://localhost:3000/api/signals \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "deviceId": "device-123",
    "data": [
      {
        "timestamp": 762,
        "lat": 51.339764,
        "lon": 12.339223833333334,
        "speed": 1.2038000000000002
      }
    ],
    "time": 1735683480000
  }'
```

### Get Signals with Filtering
```bash
curl -X GET "http://localhost:3000/api/signals?deviceId=device-123&limit=10&from=2024-01-01T00:00:00.000Z" \
  -H "X-API-Key: your-api-key"
```

### Get Device Statistics
```bash
curl -X GET "http://localhost:3000/api/signals/analytics/device-stats?deviceId=device-123" \
  -H "X-API-Key: your-api-key"
```
