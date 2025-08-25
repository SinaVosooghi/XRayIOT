// XRay-specific types for the Signals app
import {
  XRayDocument,
  BoundingBox,
  GeoJSONPoint,
  DataPoint,
  ProcessingResult,
} from '@iotp/shared-types';

import { ProcessingContext, ProcessingMetrics } from './processing.types';

// XRay Processing Types - Using shared ProcessingContext
export interface XRayProcessingContext extends ProcessingContext {
  messageId: string;
  deviceId: string;
  maxRetries: number;
  processingTime?: number;
}

export interface XRayProcessingResult
  extends ProcessingResult<{ signalId?: string; rawRef?: string }> {
  signalId?: string;
  rawRef?: string;
  context: XRayProcessingContext;
}

export interface XRayProcessingOptions {
  enableCompression: boolean;
  enableValidation: boolean;
  enableMetrics: boolean;
  maxProcessingTime: number;
  batchSize: number;
}

// XRay Statistics Calculation Types
export interface XRayStatsCalculator {
  calculateSpeedStats(data: DataPoint[]): {
    maxSpeed: number;
    avgSpeed: number;
    minSpeed: number;
    speedVariance: number;
  };

  calculateDistanceStats(data: DataPoint[]): {
    totalDistance: number;
    averageSegmentDistance: number;
    maxSegmentDistance: number;
    distanceVariance: number;
  };

  calculateBBoxStats(data: DataPoint[]): BoundingBox | null;

  calculateTimeStats(data: DataPoint[]): {
    duration: number;
    averageInterval: number;
    maxInterval: number;
    minInterval: number;
  };
}

// XRay Data Quality Types
export interface XRayDataQuality {
  completeness: number; // 0-1, percentage of expected data points
  accuracy: number; // 0-1, based on coordinate validity
  consistency: number; // 0-1, based on data format consistency
  timeliness: number; // 0-1, based on data freshness
  overall: number; // 0-1, weighted average of all metrics
}

export interface XRayDataQualityCheck {
  checkCompleteness(data: DataPoint[], expectedCount: number): number;
  checkAccuracy(data: DataPoint[]): number;
  checkConsistency(data: DataPoint[]): number;
  checkTimeliness(data: DataPoint[], maxAge: number): number;
  calculateOverallQuality(
    data: DataPoint[],
    expectedCount: number,
    maxAge: number
  ): XRayDataQuality;
}

// XRay Location Processing Types
export interface XRayLocationProcessor {
  processLocation(data: DataPoint[]): GeoJSONPoint | null;
  validateCoordinates(lat: number, lon: number): boolean;
  calculateCentroid(coordinates: Array<[number, number]>): [number, number];
  calculateBoundingBox(coordinates: Array<[number, number]>): BoundingBox;
  filterValidCoordinates(data: DataPoint[]): DataPoint[];
}

// XRay Data Transformation Types
export interface XRayDataTransformer {
  normalizeData(data: DataPoint[]): DataPoint[];
  sortByTimestamp(data: DataPoint[]): DataPoint[];
  removeDuplicates(data: DataPoint[]): DataPoint[];
  interpolateMissingPoints(data: DataPoint[], maxGap: number): DataPoint[];
  smoothData(data: DataPoint[], windowSize: number): DataPoint[];
}

// XRay Validation Types
export interface XRayValidationRule {
  name: string;
  description: string;
  validate(data: DataPoint[]): { valid: boolean; errors: string[] };
  severity: 'error' | 'warning' | 'info';
}

export interface XRayValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
  quality: XRayDataQuality;
  rules: Array<{
    rule: XRayValidationRule;
    passed: boolean;
    errors: string[];
  }>;
}

// XRay Metrics Types
export interface XRayProcessingMetrics extends ProcessingMetrics {
  averageDataLength: number;
  averageDataVolume: number;
  processingRate: number; // messages per second
  errorRate: number; // errors per second
  retryRate: number; // retries per second
}

export interface XRayDeviceMetrics {
  deviceId: string;
  totalSignals: number;
  lastSignalAt: Date;
  averageDataLength: number;
  averageDataVolume: number;
  totalDistance: number;
  maxSpeed: number;
  averageSpeed: number;
  dataQuality: XRayDataQuality;
  processingSuccessRate: number;
}

// XRay Query Types
export interface XRayQueryFilters {
  deviceId?: string | string[];
  timeRange?: {
    from: Date;
    to: Date;
  };
  dataLength?: {
    min?: number;
    max?: number;
  };
  dataVolume?: {
    min?: number;
    max?: number;
  };
  location?: {
    bbox?: BoundingBox;
    radius?: {
      center: [number, number];
      radiusKm: number;
    };
  };
  stats?: {
    minSpeed?: number;
    maxSpeed?: number;
    minDistance?: number;
    maxDistance?: number;
  };
  quality?: {
    minQuality?: number;
    hasLocation?: boolean;
    hasStats?: boolean;
  };
}

export interface XRayQueryOptions {
  sort?: {
    field: keyof XRayDocument;
    order: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
  projection?: {
    include?: Array<keyof XRayDocument>;
    exclude?: Array<keyof XRayDocument>;
  };
  populate?: {
    rawData?: boolean;
    deviceInfo?: boolean;
  };
}

// XRay Aggregation Types
export interface XRayAggregationPipeline {
  match?: XRayQueryFilters;
  group?: {
    _id: string | Record<string, unknown>;
    [key: string]: unknown;
  };
  sort?: Record<string, 1 | -1>;
  limit?: number;
  skip?: number;
  project?: Record<string, 0 | 1>;
  lookup?: {
    from: string;
    localField: string;
    foreignField: string;
    as: string;
  };
  unwind?: string | { path: string; preserveNullAndEmptyArrays?: boolean };
  facet?: Record<string, unknown[]>;
}

export interface XRayAggregationResult<T = unknown> {
  success: boolean;
  data: T[];
  count: number;
  totalCount: number;
  error?: string;
  executionTime: number;
}

// XRay Export Types
export interface XRayExportOptions {
  format: 'json' | 'csv' | 'geojson' | 'kml';
  includeRawData: boolean;
  includeStats: boolean;
  includeLocation: boolean;
  compression: boolean;
  batchSize: number;
}

export interface XRayExportResult {
  success: boolean;
  filePath?: string;
  fileSize: number;
  recordCount: number;
  format: string;
  error?: string;
  exportTime: number;
}

// XRay Health Check Types
export interface XRayHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  details: {
    processing: {
      active: boolean;
      queueSize: number;
      lastProcessedAt: Date;
    };
    storage: {
      connected: boolean;
      collectionSize: number;
      indexStatus: string[];
    };
    validation: {
      active: boolean;
      rulesCount: number;
      lastValidationAt: Date;
    };
    metrics: {
      enabled: boolean;
      lastUpdateAt: Date;
      dataPoints: number;
    };
  };
  timestamp: Date;
  responseTime: number;
}
