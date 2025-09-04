// Export canonical types first
export * from './dto/signal.dto';
export * from './generic.types';
export * from './geo.types';

export * from './xray.schema';
export * from './error.types';
export * from './mongo.types';
export * from './messaging.types';

// Export common types with conflict resolution
export {
  ErrorWithMessage,
  ErrorType,
  BinaryData,
  FileMetadata,
  StorageOptions,
  HttpRequest,
  HttpResponse,
  TimeRange as CommonTimeRange,
  TimeWindow,
  AppConfig,
} from './common.types';

// Export signals types with conflict resolution
export {
  SignalStats,
  RawMeta,
  RetryOptions,
  CircuitBreakerState,
  MessageValidationContext,
  PaginatedSignals,
} from './signals.types';

// Export validation components
export {
  BaseValidationDto,
  PaginationDto,
  TimeRangeDto,
  CoordinateDto,
  DeviceMetadataDto,
  DataPointDto,
  UpdateSignalDto,
  QuerySignalsDto,
  DeviceStatusDto,
  MessageValidationDto,
  ErrorResponseDto,
  HealthCheckDto,
  ValidationGroups,
} from './dto/validation.dto';
export { ValidationService, ValidationResult } from './validation/validation.service';
export {
  GLOBAL_VALIDATION_OPTIONS,
  createGlobalValidationPipe,
} from './validation/global-validation.pipe';
