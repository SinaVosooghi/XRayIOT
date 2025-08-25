// Export canonical types first
export * from './dto/signal.dto';
export * from './generic.types';
export * from './geo.types';

// Export legacy types (deprecated but available for migration)
// Note: Some types may conflict with canonical types - use canonical types when possible
export {
  CreateSignalDto as LegacyCreateSignalDto,
  QuerySignalsDto as LegacyQuerySignalsDto,
  SignalResponseDto as LegacySignalResponseDto,
} from './dto/xray.dto';

export * from './xray.schema';
export * from './error.types';
export * from './mongo.types';
export * from './messaging.types';

// Export common types with conflict resolution
export {
  ErrorWithMessage,
  ErrorType,
  XRayDataPoint,
  XRayDataTuple,
  XRayPayload,
  XRaySignalsPayload,
  XRayPayloadUnion,
  LegacyXRayPayload,
  XRayPayloadAllFormats,
  BinaryData,
  FileMetadata,
  StorageResult,
  RawPayload,
  StorageOptions,
  HttpRequest,
  HttpResponse,
  TimeRange as CommonTimeRange,
  TimeWindow,
  AppConfig,
  PaginatedResponse,
} from './common.types';

// Export signals types with conflict resolution
export {
  XRayCoordinates,
  XRaySample,
  XRayStats,
  XRayBBox,
  XRayLocation,
  RawMeta,
  IRawStore,
  StorageStats,
  RetryOptions,
  CircuitBreakerState,
  MessageValidationContext,
  ProcessingContext as SignalsProcessingContext,
  ProcessingMetrics,
  DeviceMetrics,
  SignalQueryFilters,
  SignalSortOptions,
  SignalPagination,
  SignalResponse,
  PaginatedSignalResponse,
  TimeRange as SignalsTimeRange,
  AggregationType,
  GroupByField,
  SignalsConfig,
  PaginatedSignals,
} from './signals.types';
