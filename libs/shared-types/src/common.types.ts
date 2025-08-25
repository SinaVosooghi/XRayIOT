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

// Validation types
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// X-Ray data types (for backward compatibility)
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

// Buffer and binary data types
export interface BinaryData {
  data: Buffer;
  mimeType: string;
  encoding: 'base64' | 'hex' | 'utf8';
  size: number;
}

export interface FileMetadata {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  encoding: string;
  hash: string;
  uploadedAt: Date;
  uploadedBy?: string;
}

// Storage types
export interface StorageResult {
  success: boolean;
  fileId?: string;
  url?: string;
  metadata?: FileMetadata;
  error?: string;
  operation: string;
  resource: string;
}

export interface RawPayload {
  deviceId: string;
  timestamp: number;
  data: Buffer | string;
  metadata?: Record<string, unknown>;
  format: 'binary' | 'json' | 'text';
  compression?: 'gzip' | 'brotli' | 'none';
  encryption?: 'aes256' | 'none';
}

export interface StorageOptions {
  compression?: boolean;
  encryption?: boolean;
  retention?: number; // days
  metadata?: Record<string, unknown>;
  tags?: string[];
}

// Network and HTTP types
export interface HttpRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
  query?: Record<string, string>;
  params?: Record<string, string>;
}

export interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body?: unknown;
  error?: string;
}

// Time and date types
export interface TimeRange {
  start: Date;
  end: Date;
  duration: number; // milliseconds
}

export interface TimeWindow {
  from: Date;
  to: Date;
  granularity: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
}

// Configuration types
export interface AppConfig {
  environment: 'development' | 'staging' | 'production';
  version: string;
  debug: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  features: Record<string, boolean>;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// DEPRECATED: Use Paginated<T> from generic.types instead
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// Re-export canonical pagination type
export { Paginated } from './generic.types';
