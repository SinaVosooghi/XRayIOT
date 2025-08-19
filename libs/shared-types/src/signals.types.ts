// Signals app specific types
import { RawPayload, StorageResult } from './common.types';
import { ErrorContext } from './error.types';

// XRay Coordinates
export interface XRayCoordinates {
  lat: number;
  lon: number;
  speed: number;
}

export interface XRaySample {
  timestamp: number;
  coordinates: XRayCoordinates;
}

// XRay Statistics
export interface XRayStats {
  maxSpeed: number;
  avgSpeed: number;
  distanceMeters: number;
  bbox?: XRayBBox;
}

export interface XRayBBox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

// XRay Location (GeoJSON Point)
export interface XRayLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

// XRay Document Schema
// XRayDocument is imported from xray.schema.ts

export interface RawMeta {
  ref: string;
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

// Response Types
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
  location?: XRayLocation;
  createdAt: Date;
  updatedAt: Date;
}

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
