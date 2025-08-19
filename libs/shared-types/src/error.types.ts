// Error handling types for the application

// Error context type
export interface ErrorContext {
  operationName: string;
  messageId?: string;
  deviceId?: string;
  timestamp: number;
  [key: string]: unknown;
}

// Base error types
export interface BaseError extends Error {
  code: string;
  context?: ErrorContext;
  timestamp: Date;
  retryable: boolean;
}

export interface ValidationError extends BaseError {
  code: 'VALIDATION_ERROR';
  field: string;
  value: unknown;
  constraint: string;
}

export interface ProcessingError extends BaseError {
  code: 'PROCESSING_ERROR';
  operation: string;
  retryCount: number;
  maxRetries: number;
}

export interface StorageError extends BaseError {
  code: 'STORAGE_ERROR';
  operation: 'store' | 'retrieve' | 'delete' | 'update';
  resource: string;
  details?: Record<string, unknown>;
}

export interface NetworkError extends BaseError {
  code: 'NETWORK_ERROR';
  endpoint: string;
  statusCode?: number;
  responseBody?: string;
}

export interface DatabaseError extends BaseError {
  code: 'DATABASE_ERROR';
  operation: string;
  collection?: string;
  query?: Record<string, unknown>;
  details?: Record<string, unknown>;
}

export interface MessageError extends BaseError {
  code: 'MESSAGE_ERROR';
  messageId?: string;
  deviceId?: string;
  payload?: unknown;
  validationErrors?: string[];
}

export interface ConfigurationError extends BaseError {
  code: 'CONFIGURATION_ERROR';
  configKey: string;
  expectedType: string;
  actualValue: unknown;
}

export interface CircuitBreakerError extends BaseError {
  code: 'CIRCUIT_BREAKER_ERROR';
  operation: string;
  state: 'OPEN' | 'HALF_OPEN';
  failures: number;
  threshold: number;
  timeout: number;
}

export interface TimeoutError extends BaseError {
  code: 'TIMEOUT_ERROR';
  operation: string;
  timeoutMs: number;
  elapsedMs: number;
}

export interface ResourceNotFoundError extends BaseError {
  code: 'RESOURCE_NOT_FOUND';
  resourceType: string;
  resourceId: string;
  searchCriteria?: Record<string, unknown>;
}

export interface DuplicateResourceError extends BaseError {
  code: 'DUPLICATE_RESOURCE';
  resourceType: string;
  resourceId: string;
  conflictingFields: string[];
}

export interface PermissionError extends BaseError {
  code: 'PERMISSION_ERROR';
  operation: string;
  resource: string;
  requiredPermissions: string[];
  userPermissions: string[];
}

export interface RateLimitError extends BaseError {
  code: 'RATE_LIMIT_ERROR';
  operation: string;
  limit: number;
  window: number;
  retryAfter: number;
}

// Union type for all application errors
export type ApplicationError =
  | ValidationError
  | ProcessingError
  | StorageError
  | NetworkError
  | DatabaseError
  | MessageError
  | ConfigurationError
  | CircuitBreakerError
  | TimeoutError
  | ResourceNotFoundError
  | DuplicateResourceError
  | PermissionError
  | RateLimitError;

// Error factory functions
export function createValidationError(
  message: string,
  field: string,
  value: unknown,
  constraint: string,
  context?: ErrorContext
): ValidationError {
  return {
    name: 'ValidationError',
    message,
    code: 'VALIDATION_ERROR',
    field,
    value,
    constraint,
    context,
    timestamp: new Date(),
    retryable: false,
  };
}

export function createProcessingError(
  message: string,
  operation: string,
  retryCount: number,
  maxRetries: number,
  context?: ErrorContext
): ProcessingError {
  return {
    name: 'ProcessingError',
    message,
    code: 'PROCESSING_ERROR',
    operation,
    retryCount,
    maxRetries,
    context,
    timestamp: new Date(),
    retryable: retryCount < maxRetries,
  };
}

export function createStorageError(
  message: string,
  operation: 'store' | 'retrieve' | 'delete' | 'update',
  resource: string,
  details?: Record<string, unknown>,
  context?: ErrorContext
): StorageError {
  return {
    name: 'StorageError',
    message,
    code: 'STORAGE_ERROR',
    operation,
    resource,
    details,
    context,
    timestamp: new Date(),
    retryable: true,
  };
}

export function createMessageError(
  message: string,
  messageId?: string,
  deviceId?: string,
  payload?: unknown,
  validationErrors?: string[],
  context?: ErrorContext
): MessageError {
  return {
    name: 'MessageError',
    message,
    code: 'MESSAGE_ERROR',
    messageId,
    deviceId,
    payload,
    validationErrors,
    context,
    timestamp: new Date(),
    retryable: false,
  };
}

export function createCircuitBreakerError(
  message: string,
  operation: string,
  state: 'OPEN' | 'HALF_OPEN',
  failures: number,
  threshold: number,
  timeout: number,
  context?: ErrorContext
): CircuitBreakerError {
  return {
    name: 'CircuitBreakerError',
    message,
    code: 'CIRCUIT_BREAKER_ERROR',
    operation,
    state,
    failures,
    threshold,
    timeout,
    context,
    timestamp: new Date(),
    retryable: false,
  };
}

// Error utility functions
export function isRetryableError(error: ApplicationError): boolean {
  return error.retryable;
}

export function isValidationError(error: ApplicationError): error is ValidationError {
  return error.code === 'VALIDATION_ERROR';
}

export function isProcessingError(error: ApplicationError): error is ProcessingError {
  return error.code === 'PROCESSING_ERROR';
}

export function isStorageError(error: ApplicationError): error is StorageError {
  return error.code === 'STORAGE_ERROR';
}

export function isMessageError(error: ApplicationError): error is MessageError {
  return error.code === 'MESSAGE_ERROR';
}

export function isCircuitBreakerError(error: ApplicationError): error is CircuitBreakerError {
  return error.code === 'CIRCUIT_BREAKER_ERROR';
}

// Error context builders
export function buildErrorContext(
  operationName: string,
  additionalContext?: Record<string, unknown>
): ErrorContext {
  return {
    operationName,
    timestamp: Date.now(),
    ...additionalContext,
  };
}

export function enrichErrorContext(
  context: ErrorContext,
  additionalContext: Record<string, unknown>
): ErrorContext {
  return {
    ...context,
    ...additionalContext,
  };
}

// Error serialization for logging
export function serializeError(error: ApplicationError): Record<string, unknown> {
  return {
    name: error.name,
    message: error.message,
    code: error.code,
    context: error.context,
    timestamp: error.timestamp.toISOString(),
    retryable: error.retryable,
    stack: error.stack,
  };
}

// Error aggregation for metrics
export interface ErrorMetrics {
  totalErrors: number;
  errorsByCode: Record<string, number>;
  errorsByOperation: Record<string, number>;
  retryableErrors: number;
  nonRetryableErrors: number;
  lastErrorAt: Date;
}

export function aggregateErrors(errors: ApplicationError[]): ErrorMetrics {
  const metrics: ErrorMetrics = {
    totalErrors: errors.length,
    errorsByCode: {},
    errorsByOperation: {},
    retryableErrors: 0,
    nonRetryableErrors: 0,
    lastErrorAt: new Date(0),
  };

  for (const error of errors) {
    // Count by code
    metrics.errorsByCode[error.code] = (metrics.errorsByCode[error.code] || 0) + 1;

    // Count by operation
    if (error.context?.operationName) {
      metrics.errorsByOperation[error.context.operationName] =
        (metrics.errorsByOperation[error.context.operationName] || 0) + 1;
    }

    // Count retryable vs non-retryable
    if (error.retryable) {
      metrics.retryableErrors++;
    } else {
      metrics.nonRetryableErrors++;
    }

    // Track last error
    if (error.timestamp > metrics.lastErrorAt) {
      metrics.lastErrorAt = error.timestamp;
    }
  }

  return metrics;
}
