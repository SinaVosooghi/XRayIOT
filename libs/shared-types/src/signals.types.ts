// Signals app specific types
import { ErrorContext } from './error.types';
import { SignalDto } from './dto/signal.dto';
import { BoundingBox } from './geo.types';
import { Paginated } from './generic.types';

// Re-export canonical types
export { DataPoint, SignalDto } from './dto/signal.dto';
export { BoundingBox, GeoJSONPoint } from './geo.types';

// Signal Statistics
export interface SignalStats {
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

// Raw Store Interface - REMOVED: These are app-specific to signals app
// IRawStore, StorageStats moved to apps/signals/src/types/raw.types.ts

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

// Type aliases for backward compatibility
export type PaginatedSignals = Paginated<SignalDto>;
