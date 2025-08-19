// Common types to replace 'any' usage throughout the codebase
import { Buffer } from 'buffer';

// Error types
export interface ErrorWithMessage {
  message: string;
  stack?: string;
  name?: string;
  code?: string | number;
}

export type ErrorType = Error | ErrorWithMessage | string;

// Message types for RabbitMQ
export interface RabbitMQMessage {
  content: Buffer;
  fields: {
    deliveryTag: number;
    redelivered: boolean;
    exchange: string;
    routingKey: string;
  };
  properties: {
    contentType?: string;
    contentEncoding?: string;
    headers?: Record<string, unknown>;
    deliveryMode?: number;
    priority?: number;
    correlationId?: string;
    replyTo?: string;
    expiration?: string;
    messageId?: string;
    timestamp?: number;
    type?: string;
    userId?: string;
    appId?: string;
  };
}

// X-Ray data types
export interface XRayDataPoint {
  timestamp: number;
  coordinates: [number, number, number]; // [lat, lon, altitude]
}

// Alternative format for signals service compatibility
export type XRayDataTuple = [number, [number, number, number]]; // [timestamp, [lat, lon, speed]]

export interface XRayPayload {
  deviceId: string;
  data: XRayDataPoint[];
  time: number;
}

// Signals service compatible payload
export interface XRaySignalsPayload {
  deviceId: string;
  data: XRayDataTuple[];
  time: number;
}

// Union type for both formats
export type XRayPayloadUnion = XRayPayload | XRaySignalsPayload;

// Legacy format for backward compatibility (used in tests and some services)
export interface LegacyXRayPayload {
  [deviceId: string]: {
    data: XRayDataTuple[];
    time: number;
  };
}

// Union type including legacy format
export type XRayPayloadAllFormats = XRayPayload | XRaySignalsPayload | LegacyXRayPayload;

export interface XRayMessage extends RabbitMQMessage {
  content: Buffer;
  fields: RabbitMQMessage['fields'];
  properties: RabbitMQMessage['properties'];
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  cursor?: string;
}

// Raw storage types
export interface RawPayload {
  deviceId: string;
  data: XRayDataPoint[];
  time: number;
  metadata?: Record<string, unknown>;
}

export interface StorageResult {
  id: string;
  size: number;
  hash: string;
  url?: string;
}

// Test and mock types
export interface MockService {
  [key: string]: unknown;
}

export interface TestContext {
  module: unknown;
  app?: unknown;
}

// HTTP Response types
export interface HttpResponse<T = unknown> {
  ok: boolean;
  status: number;
  statusText: string;
  json(): Promise<T>;
  text(): Promise<string>;
}

// Configuration types
export interface AppConfig {
  [key: string]: unknown;
}

// Validation types
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Utility types
export type SortOrder = 'asc' | 'desc';
export type SortField = 'time' | 'deviceId' | 'dataLength' | 'dataVolume' | 'createdAt';
export type TimePeriod = 'hour' | 'day' | 'week' | 'month';
export type GroupBy = 'device' | 'time';

// Redis types
export interface RedisClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
}

// MinIO types
export interface MinioClient {
  putObject(bucket: string, object: string, stream: Buffer): Promise<{ etag: string }>;
  getObject(bucket: string, object: string): Promise<Buffer>;
  removeObject(bucket: string, object: string): Promise<void>;
  presignedGetObject(bucket: string, object: string, ttl?: number): Promise<string>;
}
