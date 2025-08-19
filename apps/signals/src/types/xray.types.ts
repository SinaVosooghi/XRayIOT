// XRay-specific types for the Signals app
import { XRayDocument, XRayBBox, XRayLocation, XRayDataTuple } from '@iotp/shared-types';

// XRay Processing Types
export interface XRayProcessingContext {
  messageId: string;
  deviceId: string;
  timestamp: number;
  startTime: number;
  retryCount: number;
  maxRetries: number;
  processingTime?: number;
}

export interface XRayProcessingResult {
  success: boolean;
  signalId?: string;
  rawRef?: string;
  processingTime: number;
  error?: string;
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
  calculateSpeedStats(data: XRayDataTuple[]): {
    maxSpeed: number;
    avgSpeed: number;
    minSpeed: number;
    speedVariance: number;
  };

  calculateDistanceStats(data: XRayDataTuple[]): {
    totalDistance: number;
    averageSegmentDistance: number;
    maxSegmentDistance: number;
    distanceVariance: number;
  };

  calculateBBoxStats(data: XRayDataTuple[]): XRayBBox | null;

  calculateTimeStats(data: XRayDataTuple[]): {
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
  checkCompleteness(data: XRayDataTuple[], expectedCount: number): number;
  checkAccuracy(data: XRayDataTuple[]): number;
  checkConsistency(data: XRayDataTuple[]): number;
  checkTimeliness(data: XRayDataTuple[], maxAge: number): number;
  calculateOverallQuality(
    data: XRayDataTuple[],
    expectedCount: number,
    maxAge: number
  ): XRayDataQuality;
}

// XRay Location Processing Types
export interface XRayLocationProcessor {
  processLocation(data: XRayDataTuple[]): XRayLocation | null;
  validateCoordinates(lat: number, lon: number): boolean;
  calculateCentroid(coordinates: Array<[number, number]>): [number, number];
  calculateBoundingBox(coordinates: Array<[number, number]>): XRayBBox;
  filterValidCoordinates(data: XRayDataTuple[]): XRayDataTuple[];
}

// XRay Data Transformation Types
export interface XRayDataTransformer {
  normalizeData(data: XRayDataTuple[]): XRayDataTuple[];
  sortByTimestamp(data: XRayDataTuple[]): XRayDataTuple[];
  removeDuplicates(data: XRayDataTuple[]): XRayDataTuple[];
  interpolateMissingPoints(data: XRayDataTuple[], maxGap: number): XRayDataTuple[];
  smoothData(data: XRayDataTuple[], windowSize: number): XRayDataTuple[];
}

// XRay Validation Types
export interface XRayValidationRule {
  name: string;
  description: string;
  validate(data: XRayDataTuple[]): { valid: boolean; errors: string[] };
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
export interface XRayProcessingMetrics {
  totalProcessed: number;
  totalErrors: number;
  totalRetries: number;
  averageProcessingTime: number;
  averageDataLength: number;
  averageDataVolume: number;
  lastProcessedAt: Date;
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
    bbox?: XRayBBox;
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
