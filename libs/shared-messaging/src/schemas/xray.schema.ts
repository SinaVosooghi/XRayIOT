import { JSONSchema7 } from 'json-schema';

// XRay Raw Signal Schema
export const xrayRawSignalSchema: JSONSchema7 = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'XRayRawSignal',
  type: 'object',
  properties: {
    deviceId: {
      type: 'string',
      pattern: '^[a-zA-Z0-9_-]+$',
      minLength: 1,
      maxLength: 100,
      description: 'Unique identifier for the IoT device'
    },
    capturedAt: {
      type: 'string',
      format: 'date-time',
      description: 'ISO 8601 timestamp when the signal was captured'
    },
    payload: {
      type: 'string',
      minLength: 1,
      maxLength: 1048576, // 1MB limit
      description: 'Base64 encoded or JSON string payload'
    },
    schemaVersion: {
      type: 'string',
      enum: ['v1', 'v2'],
      default: 'v1',
      description: 'Schema version for forward compatibility'
    },
    metadata: {
      type: 'object',
      properties: {
        location: {
          type: 'object',
          properties: {
            latitude: { type: 'number', minimum: -90, maximum: 90 },
            longitude: { type: 'number', minimum: -180, maximum: 180 },
            altitude: { type: 'number' }
          },
          required: ['latitude', 'longitude']
        },
        battery: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Battery level percentage'
        },
        signalStrength: {
          type: 'number',
          minimum: -120,
          maximum: 0,
          description: 'Signal strength in dBm'
        }
      }
    },
    correlationId: {
      type: 'string',
      format: 'uuid',
      description: 'Correlation ID for tracing across services'
    }
  },
  required: ['deviceId', 'capturedAt', 'payload', 'schemaVersion'],
  additionalProperties: false
};

// XRay Processed Signal Schema
export const xrayProcessedSignalSchema: JSONSchema7 = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'XRayProcessedSignal',
  type: 'object',
  properties: {
    deviceId: {
      type: 'string',
      pattern: '^[a-zA-Z0-9_-]+$',
      minLength: 1,
      maxLength: 100
    },
    processedAt: {
      type: 'string',
      format: 'date-time'
    },
    originalPayload: {
      type: 'string',
      minLength: 1
    },
    processedData: {
      type: 'object',
      properties: {
        readings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['temperature', 'humidity', 'pressure', 'motion'] },
              value: { type: 'number' },
              unit: { type: 'string' },
              confidence: { type: 'number', minimum: 0, maximum: 1 }
            },
            required: ['type', 'value', 'unit']
          }
        },
        anomalies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              description: { type: 'string' }
            },
            required: ['type', 'severity', 'description']
          }
        }
      }
    },
    schemaVersion: {
      type: 'string',
      enum: ['v1', 'v2'],
      default: 'v1'
    },
    correlationId: {
      type: 'string',
      format: 'uuid'
    }
  },
  required: ['deviceId', 'processedAt', 'originalPayload', 'processedData', 'schemaVersion'],
  additionalProperties: false
};

// Device Status Update Schema
export const deviceStatusUpdateSchema: JSONSchema7 = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'DeviceStatusUpdate',
  type: 'object',
  properties: {
    deviceId: {
      type: 'string',
      pattern: '^[a-zA-Z0-9_-]+$',
      minLength: 1,
      maxLength: 100
    },
    status: {
      type: 'string',
      enum: ['online', 'offline', 'error', 'maintenance', 'low_battery']
    },
    lastSeen: {
      type: 'string',
      format: 'date-time'
    },
    health: {
      type: 'object',
      properties: {
        battery: { type: 'number', minimum: 0, maximum: 100 },
        signalStrength: { type: 'number', minimum: -120, maximum: 0 },
        temperature: { type: 'number' },
        uptime: { type: 'number', minimum: 0 }
      }
    },
    correlationId: {
      type: 'string',
      format: 'uuid'
    }
  },
  required: ['deviceId', 'status', 'lastSeen'],
  additionalProperties: false
};

// Schema registry for easy access
export const schemas = {
  'xray.raw.v1': xrayRawSignalSchema,
  'xray.processed.v1': xrayProcessedSignalSchema,
  'device.status.v1': deviceStatusUpdateSchema
};

// Schema version mapping
export const schemaVersions = {
  'xray.raw': ['v1'],
  'xray.processed': ['v1'],
  'device.status': ['v1']
};

// Export types for TypeScript
export type XRayRawSignal = {
  deviceId: string;
  capturedAt: string;
  payload: string;
  schemaVersion: 'v1' | 'v2';
  metadata?: {
    location?: {
      latitude: number;
      longitude: number;
      altitude?: number;
    };
    battery?: number;
    signalStrength?: number;
  };
  correlationId?: string;
};

export type XRayProcessedSignal = {
  deviceId: string;
  processedAt: string;
  originalPayload: string;
  processedData: {
    readings: Array<{
      type: 'temperature' | 'humidity' | 'pressure' | 'motion';
      value: number;
      unit: string;
      confidence?: number;
    }>;
    anomalies?: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
    }>;
  };
  schemaVersion: 'v1' | 'v2';
  correlationId?: string;
};

export type DeviceStatusUpdate = {
  deviceId: string;
  status: 'online' | 'offline' | 'error' | 'maintenance' | 'low_battery';
  lastSeen: string;
  health?: {
    battery?: number;
    signalStrength?: number;
    temperature?: number;
    uptime?: number;
  };
  correlationId?: string;
};
