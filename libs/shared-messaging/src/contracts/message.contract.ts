/**
 * Message Contract Definitions
 *
 * This file defines the canonical message contracts for the XRayIOT system.
 * All message producers and consumers must use these contracts to ensure
 * compatibility and proper versioning.
 */

export interface BaseMessageContract {
  /** Schema version for forward/backward compatibility */
  schemaVersion: string;

  /** Unique idempotency key to prevent duplicate processing */
  idempotencyKey: string;

  /** Correlation ID for tracing across services */
  correlationId: string;

  /** Timestamp when the message was created */
  createdAt: string; // ISO 8601 format

  /** Message type identifier */
  messageType: string;
}

export interface XRayRawMessageContract extends BaseMessageContract {
  messageType: 'xray.raw';
  schemaVersion: 'v1.0' | 'v1.1';

  /** Device identifier */
  deviceId: string;

  /** Timestamp when the signal was captured by the device */
  capturedAt: string; // ISO 8601 format

  /** Base64 encoded or JSON string payload */
  payload: string;

  /** Device metadata */
  metadata?: {
    location?: {
      latitude: number;
      longitude: number;
      altitude?: number;
    };
    battery?: number; // 0-100 percentage
    signalStrength?: number; // dBm
    temperature?: number; // Celsius
    uptime?: number; // seconds
  };
}

export interface XRayProcessedMessageContract extends BaseMessageContract {
  messageType: 'xray.processed';
  schemaVersion: 'v1.0' | 'v1.1';

  /** Device identifier */
  deviceId: string;

  /** Timestamp when the signal was processed */
  processedAt: string; // ISO 8601 format

  /** Original raw payload reference */
  originalPayload: string;

  /** Processed data results */
  processedData: {
    readings: Array<{
      type: 'temperature' | 'humidity' | 'pressure' | 'motion' | 'xray_intensity';
      value: number;
      unit: string;
      confidence: number; // 0-1
      timestamp: string; // ISO 8601 format
    }>;
    anomalies: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      timestamp: string; // ISO 8601 format
    }>;
    statistics: {
      totalReadings: number;
      averageValue: number;
      minValue: number;
      maxValue: number;
      standardDeviation: number;
    };
  };

  /** Processing metadata */
  processingMetadata: {
    processingTimeMs: number;
    algorithmVersion: string;
    confidence: number; // 0-1
    qualityScore: number; // 0-1
  };
}

export interface DeviceStatusMessageContract extends BaseMessageContract {
  messageType: 'device.status';
  schemaVersion: 'v1.0' | 'v1.1';

  /** Device identifier */
  deviceId: string;

  /** Current device status */
  status: 'online' | 'offline' | 'error' | 'maintenance';

  /** Last seen timestamp */
  lastSeen: string; // ISO 8601 format

  /** Device health information */
  health?: {
    battery?: number; // 0-100 percentage
    signalStrength?: number; // dBm
    temperature?: number; // Celsius
    uptime?: number; // seconds
    errorCount?: number;
    lastError?: string;
  };

  /** Device capabilities */
  capabilities: {
    supportedMessageTypes: string[];
    maxPayloadSize: number;
    supportedProtocols: string[];
  };
}

export interface ErrorMessageContract extends BaseMessageContract {
  messageType: 'error';
  schemaVersion: 'v1.0';

  /** Error details */
  error: {
    code: string;
    message: string;
    stack?: string;
    context?: Record<string, unknown>;
  };

  /** Original message that caused the error */
  originalMessage?: {
    messageType: string;
    idempotencyKey: string;
    correlationId: string;
  };
}

// Union type for all message contracts
export type MessageContract =
  | XRayRawMessageContract
  | XRayProcessedMessageContract
  | DeviceStatusMessageContract
  | ErrorMessageContract;

// Message type constants
export const MESSAGE_TYPES = {
  XRAY_RAW: 'xray.raw',
  XRAY_PROCESSED: 'xray.processed',
  DEVICE_STATUS: 'device.status',
  ERROR: 'error',
} as const;

// Schema version constants
export const SCHEMA_VERSIONS = {
  V1_0: 'v1.0',
  V1_1: 'v1.1',
} as const;

// Current supported schema versions
export const SUPPORTED_SCHEMA_VERSIONS = [SCHEMA_VERSIONS.V1_0, SCHEMA_VERSIONS.V1_1] as const;

// Message contract validation
export function isMessageContract(message: unknown): message is MessageContract {
  return (
    typeof message === 'object' &&
    message !== null &&
    'schemaVersion' in message &&
    'idempotencyKey' in message &&
    'correlationId' in message &&
    'createdAt' in message &&
    'messageType' in message
  );
}

// Schema version validation
export function isSupportedSchemaVersion(
  version: string
): version is (typeof SCHEMA_VERSIONS)[keyof typeof SCHEMA_VERSIONS] {
  return SUPPORTED_SCHEMA_VERSIONS.includes(
    version as (typeof SCHEMA_VERSIONS)[keyof typeof SCHEMA_VERSIONS]
  );
}

// Message type validation
export function isValidMessageType(
  type: string
): type is (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES] {
  return Object.values(MESSAGE_TYPES).includes(
    type as (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES]
  );
}
