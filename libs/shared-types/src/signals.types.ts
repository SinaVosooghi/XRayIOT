// Signals app specific types
import { RawPayload, StorageResult } from './common.types';
import { ErrorContext } from './error.types';
import { SignalDto } from './dto/signal.dto';
import { BoundingBox } from './geo.types';
import { Paginated } from './generic.types';

// Re-export canonical types
export { DataPoint, SignalDto } from './dto/signal.dto';
export { Coordinate3D, BoundingBox, GeoJSONPoint } from './geo.types';

// Import the standardized types for use in this file
import { Coordinate3D, GeoJSONPoint } from './geo.types';

// XRay Sample - DEPRECATED: Use DataPoint from signal.dto instead
export interface XRaySample {
  timestamp: number;
  coordinates: Coordinate3D; // Use standardized Coordinate3D
}

// XRay Statistics
export interface XRayStats {
  maxSpeed: number;
  avgSpeed: number;
  distanceMeters: number;
  bbox?: BoundingBox;
}





// XRay Document Schema
// XRayDocument is imported from xray.schema.ts

export interface RawMeta {
  ref: string; // DEPRECATED: Use rawRef for consistency
  hash: string;
  size: number;
  metadata?: Record<string, unknown>;
}

// Raw Store Interface
export interface IRawStore {
  store(payload: RawPayload): Promise<string>;
  getPresignedUrl(ref: string, ttlSec: number): Promise<string>;
  getMetadata(ref: string): Promise<StorageResult>;
  delete(ref: string): Promise<boolean>;
  exists(ref: string): Promise<boolean>;
  getFileSize(ref: string): Promise<number>;
  getStorageStats(): Promise<Record<string, unknown>>;
}

// Storage Statistics
export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  avgFileSize: number;
  storageSize: number;
  indexSize: number;
}

// Error Handling Types
// ErrorContext is imported from error.types.ts

export interface RetryOptions {
  maxRetries: number;
  retryDelays: number[];
  operationName: string;
  context?: ErrorContext;
}

export interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  threshold: number;
  timeout: number;
}

// Validation Types

export interface MessageValidationContext {
  messageId?: string;
  deviceId?: string;
  timestamp?: number;
}

// Processing Context
export interface ProcessingContext {
  messageId: string;
  deviceId: string;
  timestamp: number;
  retryCount: number;
  startTime: number;
}

// Metrics and Monitoring
export interface ProcessingMetrics {
  totalProcessed: number;
  totalErrors: number;
  totalRetries: number;
  averageProcessingTime: number;
  lastProcessedAt: Date;
}

export interface DeviceMetrics {
  deviceId: string;
  totalSignals: number;
  lastSignalAt: Date;
  averageDataLength: number;
  averageDataVolume: number;
  totalDistance: number;
  maxSpeed: number;
  averageSpeed: number;
}

// Query and Filter Types
export interface SignalQueryFilters {
  deviceId?: string;
  from?: Date;
  to?: Date;
  minDataLength?: number;
  maxDataLength?: number;
  minDataVolume?: number;
  maxDataVolume?: number;
  minLat?: number;
  maxLat?: number;
  minLon?: number;
  maxLon?: number;
  hasLocation?: boolean;
  hasStats?: boolean;
}

export interface SignalSortOptions {
  field: 'time' | 'deviceId' | 'dataLength' | 'dataVolume' | 'createdAt';
  order: 'asc' | 'desc';
}

export interface SignalPagination {
  limit: number;
  skip?: number;
  cursor?: string;
}

// Response Types - DEPRECATED: Use SignalDto from signal.dto instead
export interface SignalResponse {
  _id: string;
  deviceId: string;
  time: Date;
  dataLength: number;
  dataVolume: number;
  stats?: XRayStats;
  rawRef?: string;
  rawHash?: string;
  rawSizeBytes?: number;
  location?: GeoJSONPoint;
  createdAt: Date;
  updatedAt: Date;
}

// Pagination Response - DEPRECATED: Use Paginated<SignalDto> from generic.types instead
export interface PaginatedSignalResponse {
  items: SignalResponse[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  cursor?: string;
}

// Utility Types
export type TimeRange = 'hour' | 'day' | 'week' | 'month' | 'year';
export type AggregationType = 'count' | 'sum' | 'avg' | 'min' | 'max';
export type GroupByField = 'device' | 'time' | 'location' | 'stats';

// Configuration Types
export interface SignalsConfig {
  maxRetries: number;
  retryDelays: number[];
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
  maxProcessingTime: number;
  batchSize: number;
  enableMetrics: boolean;
  enableTracing: boolean;
}

// Type aliases for backward compatibility
export type PaginatedSignals = Paginated<SignalDto>;
