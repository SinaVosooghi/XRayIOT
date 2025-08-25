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

// Storage types - REMOVED: These are app-specific to signals app
// StorageResult, RawPayload moved to apps/signals/src/types/raw.types.ts

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

// Re-export canonical pagination type
export { Paginated } from './generic.types';
