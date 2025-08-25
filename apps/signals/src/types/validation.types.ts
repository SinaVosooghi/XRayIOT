// Validation types for the Signals app
import { XRayPayloadAllFormats, DataPoint } from '@iotp/shared-types';

// Base Validation Types
export interface ValidationRule<T = unknown> {
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
  validate(input: T): ValidationRuleResult;
  getErrorMessage(input: T): string;
  getWarningMessage(input: T): string;
  getInfoMessage(input: T): string;
}

export interface ValidationRuleResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
  metadata?: Record<string, unknown>;
  executionTime: number;
}

export interface ValidationResult<T = unknown> {
  valid: boolean;
  input: T;
  errors: string[];
  warnings: string[];
  info: string[];
  rules: Array<{
    rule: ValidationRule<T>;
    result: ValidationRuleResult;
  }>;
  metadata?: Record<string, unknown>;
  executionTime: number;
  timestamp: Date;
}

// Schema Validation Types
export interface SchemaValidationRule extends ValidationRule<XRayPayloadAllFormats> {
  schema: unknown;
  validateSchema(input: XRayPayloadAllFormats): ValidationRuleResult;
  getSchemaErrors(input: XRayPayloadAllFormats): string[];
}

export interface SchemaValidator {
  validate(message: XRayPayloadAllFormats): ValidationResult<XRayPayloadAllFormats>;
  validateSchema(message: XRayPayloadAllFormats): ValidationResult<XRayPayloadAllFormats>;
  getSchema(): unknown;
  setSchema(schema: unknown): void;
}

// Business Rule Validation Types
export interface BusinessRuleValidationRule extends ValidationRule<XRayPayloadAllFormats> {
  category: 'data' | 'business' | 'security' | 'compliance';
  priority: 'high' | 'medium' | 'low';
  validateBusinessRules(input: XRayPayloadAllFormats): ValidationRuleResult;
}

export interface BusinessRuleValidator {
  validate(message: XRayPayloadAllFormats): ValidationResult<XRayPayloadAllFormats>;
  validateBusinessRules(message: XRayPayloadAllFormats): ValidationResult<XRayPayloadAllFormats>;
  getRules(): BusinessRuleValidationRule[];
  addRule(rule: BusinessRuleValidationRule): void;
  removeRule(ruleName: string): void;
  enableRule(ruleName: string): void;
  disableRule(ruleName: string): void;
}

// Data Quality Validation Types
export interface DataQualityValidationRule extends ValidationRule<XRayPayloadAllFormats> {
  metric: 'completeness' | 'accuracy' | 'consistency' | 'timeliness' | 'validity';
  threshold: number;
  validateDataQuality(input: XRayPayloadAllFormats): ValidationRuleResult;
  calculateQualityScore(input: XRayPayloadAllFormats): number;
}

export interface DataQualityValidator {
  validate(message: XRayPayloadAllFormats): ValidationResult<XRayPayloadAllFormats>;
  validateDataQuality(message: XRayPayloadAllFormats): ValidationResult<XRayPayloadAllFormats>;
  getQualityScore(message: XRayPayloadAllFormats): DataQualityScore;
  getRules(): DataQualityValidationRule[];
  setThreshold(metric: string, threshold: number): void;
}

export interface DataQualityScore {
  completeness: number; // 0-1
  accuracy: number; // 0-1
  consistency: number; // 0-1
  timeliness: number; // 0-1
  validity: number; // 0-1
  overall: number; // 0-1, weighted average
  details: Record<string, number>;
}

// Field Validation Types
export interface FieldValidationRule extends ValidationRule<unknown> {
  field: string;
  fieldType: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date';
  constraints: FieldConstraints;
  validateField(value: unknown): ValidationRuleResult;
}

export interface FieldConstraints {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: unknown[];
  custom?: (value: unknown) => boolean;
  message?: string;
}

export interface FieldValidator {
  validateField(field: string, value: unknown, constraints: FieldConstraints): ValidationRuleResult;
  validateFields(
    fields: Record<string, unknown>,
    fieldRules: Record<string, FieldValidationRule>
  ): ValidationResult<Record<string, unknown>>;
}

// Coordinate Validation Types
export interface CoordinateValidationRule extends ValidationRule<DataPoint[]> {
  validateCoordinates(data: DataPoint[]): ValidationRuleResult;
  validateLatitude(lat: number): boolean;
  validateLongitude(lon: number): boolean;
  validateSpeed(speed: number): boolean;
  validateTimestamp(timestamp: number): boolean;
}

export interface CoordinateValidator {
  validateCoordinates(data: DataPoint[]): ValidationResult<DataPoint[]>;
  validateLatitude(lat: number): boolean;
  validateLongitude(lon: number): boolean;
  validateSpeed(speed: number): boolean;
  validateTimestamp(timestamp: number): boolean;
  getCoordinateErrors(data: DataPoint[]): string[];
}

// Device Validation Types
export interface DeviceValidationRule extends ValidationRule<XRayPayloadAllFormats> {
  validateDeviceId(deviceId: string): ValidationRuleResult;
  validateDevicePermissions(deviceId: string): ValidationRuleResult;
  validateDeviceQuota(deviceId: string): ValidationRuleResult;
}

export interface DeviceValidator {
  validateDevice(message: XRayPayloadAllFormats): ValidationResult<XRayPayloadAllFormats>;
  validateDeviceId(deviceId: string): ValidationResult<string>;
  validateDevicePermissions(deviceId: string): ValidationResult<string>;
  validateDeviceQuota(deviceId: string): ValidationResult<string>;
  isDeviceActive(deviceId: string): boolean;
  getDeviceQuota(deviceId: string): DeviceQuota;
}

export interface DeviceQuota {
  deviceId: string;
  dailyLimit: number;
  dailyUsed: number;
  monthlyLimit: number;
  monthlyUsed: number;
  remaining: number;
  resetDate: Date;
}

// Time Validation Types
export interface TimeValidationRule extends ValidationRule<XRayPayloadAllFormats> {
  validateTimestamp(timestamp: number): ValidationRuleResult;
  validateTimeRange(from: number, to: number): ValidationRuleResult;
  validateTimeOrder(data: DataPoint[]): ValidationRuleResult;
  validateTimeConsistency(data: DataPoint[]): ValidationRuleResult;
}

export interface TimeValidator {
  validateTime(message: XRayPayloadAllFormats): ValidationResult<XRayPayloadAllFormats>;
  validateTimestamp(timestamp: number): ValidationResult<number>;
  validateTimeRange(from: number, to: number): ValidationResult<{ from: number; to: number }>;
  validateTimeOrder(data: DataPoint[]): ValidationResult<DataPoint[]>;
  validateTimeConsistency(data: DataPoint[]): ValidationResult<DataPoint[]>;
  isTimestampValid(timestamp: number): boolean;
  isTimeRangeValid(from: number, to: number): boolean;
}

// Size Validation Types
export interface SizeValidationRule extends ValidationRule<XRayPayloadAllFormats> {
  validateDataLength(data: DataPoint[]): ValidationRuleResult;
  validateDataVolume(message: XRayPayloadAllFormats): ValidationRuleResult;
  validateMessageSize(message: XRayPayloadAllFormats): ValidationRuleResult;
}

export interface SizeValidator {
  validateSize(message: XRayPayloadAllFormats): ValidationResult<XRayPayloadAllFormats>;
  validateDataLength(data: DataPoint[]): ValidationResult<DataPoint[]>;
  validateDataVolume(message: XRayPayloadAllFormats): ValidationResult<XRayPayloadAllFormats>;
  validateMessageSize(message: XRayPayloadAllFormats): ValidationResult<XRayPayloadAllFormats>;
  getSizeLimits(): SizeLimits;
  setSizeLimits(limits: SizeLimits): void;
}

export interface SizeLimits {
  maxDataLength: number;
  maxDataVolume: number;
  maxMessageSize: number;
  minDataLength: number;
  minDataVolume: number;
  minMessageSize: number;
}

// Format Validation Types
export interface FormatValidationRule extends ValidationRule<XRayPayloadAllFormats> {
  validateFormat(message: XRayPayloadAllFormats): ValidationRuleResult;
  validateStructure(message: XRayPayloadAllFormats): ValidationRuleResult;
  validateTypes(message: XRayPayloadAllFormats): ValidationRuleResult;
}

export interface FormatValidator {
  validateFormat(message: XRayPayloadAllFormats): ValidationResult<XRayPayloadAllFormats>;
  validateStructure(message: XRayPayloadAllFormats): ValidationResult<XRayPayloadAllFormats>;
  validateTypes(message: XRayPayloadAllFormats): ValidationResult<XRayPayloadAllFormats>;
  isLegacyFormat(message: XRayPayloadAllFormats): boolean;
  isNormalizedFormat(message: XRayPayloadAllFormats): boolean;
  getFormatType(message: XRayPayloadAllFormats): 'legacy' | 'normalized' | 'unknown';
}

// Security Validation Types
export interface SecurityValidationRule extends ValidationRule<XRayPayloadAllFormats> {
  validateAuthentication(message: XRayPayloadAllFormats): ValidationRuleResult;
  validateAuthorization(message: XRayPayloadAllFormats): ValidationRuleResult;
  validateIntegrity(message: XRayPayloadAllFormats): ValidationRuleResult;
  validateEncryption(message: XRayPayloadAllFormats): ValidationRuleResult;
}

export interface SecurityValidator {
  validateSecurity(message: XRayPayloadAllFormats): ValidationResult<XRayPayloadAllFormats>;
  validateAuthentication(message: XRayPayloadAllFormats): ValidationResult<XRayPayloadAllFormats>;
  validateAuthorization(message: XRayPayloadAllFormats): ValidationResult<XRayPayloadAllFormats>;
  validateIntegrity(message: XRayPayloadAllFormats): ValidationResult<XRayPayloadAllFormats>;
  validateEncryption(message: XRayPayloadAllFormats): ValidationResult<XRayPayloadAllFormats>;
  isAuthenticated(message: XRayPayloadAllFormats): boolean;
  isAuthorized(message: XRayPayloadAllFormats): boolean;
}

// Composite Validation Types
export interface CompositeValidator {
  validators: Array<{
    name: string;
    validator: ValidationRule<XRayPayloadAllFormats>;
    enabled: boolean;
    order: number;
  }>;

  validate(message: XRayPayloadAllFormats): ValidationResult<XRayPayloadAllFormats>;
  addValidator(validator: ValidationRule<XRayPayloadAllFormats>, order?: number): void;
  removeValidator(validatorName: string): void;
  enableValidator(validatorName: string): void;
  disableValidator(validatorName: string): void;
  reorderValidators(validatorName: string, newOrder: number): void;
  getValidator(validatorName: string): ValidationRule<XRayPayloadAllFormats> | undefined;
}

// Validation Configuration Types
export interface ValidationConfig {
  schema: {
    enabled: boolean;
    strict: boolean;
    additionalProperties: boolean;
  };
  businessRules: {
    enabled: boolean;
    categories: string[];
    priorities: string[];
  };
  dataQuality: {
    enabled: boolean;
    metrics: string[];
    thresholds: Record<string, number>;
  };
  fields: {
    enabled: boolean;
    strict: boolean;
    customRules: Record<string, FieldConstraints>;
  };
  coordinates: {
    enabled: boolean;
    latitudeRange: { min: number; max: number };
    longitudeRange: { min: number; max: number };
    speedRange: { min: number; max: number };
    timestampRange: { min: number; max: number };
  };
  device: {
    enabled: boolean;
    checkPermissions: boolean;
    checkQuota: boolean;
    activeDevicesOnly: boolean;
  };
  time: {
    enabled: boolean;
    maxAge: number;
    minInterval: number;
    maxInterval: number;
    checkOrder: boolean;
    checkConsistency: boolean;
  };
  size: {
    enabled: boolean;
    limits: SizeLimits;
  };
  format: {
    enabled: boolean;
    allowedFormats: string[];
    strictFormat: boolean;
  };
  security: {
    enabled: boolean;
    requireAuthentication: boolean;
    requireAuthorization: boolean;
    checkIntegrity: boolean;
    checkEncryption: boolean;
  };
  composite: {
    enabled: boolean;
    stopOnFirstError: boolean;
    includeWarnings: boolean;
    includeInfo: boolean;
    parallelValidation: boolean;
  };
  monitoring: {
    enableMetrics: boolean;
    enableLogging: boolean;
    enableTracing: boolean;
    metricsInterval: number;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

// Validation Metrics Types
export interface ValidationMetrics {
  totalValidations: number;
  successfulValidations: number;
  failedValidations: number;
  averageValidationTime: number;
  validationRate: number; // validations per second
  errorRate: number; // errors per second
  warningRate: number; // warnings per second
  lastValidationAt: Date;
  lastErrorAt?: Date;
  validatorMetrics: Record<
    string,
    {
      totalExecutions: number;
      successfulExecutions: number;
      failedExecutions: number;
      averageExecutionTime: number;
      lastExecutionAt: Date;
      errorRate: number;
    }
  >;
}

// Validation Health Check Types
export interface ValidationHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  details: {
    schema: {
      active: boolean;
      rulesCount: number;
      lastValidationAt: Date;
    };
    businessRules: {
      active: boolean;
      rulesCount: number;
      lastValidationAt: Date;
    };
    dataQuality: {
      active: boolean;
      metricsCount: number;
      lastValidationAt: Date;
    };
    fields: {
      active: boolean;
      rulesCount: number;
      lastValidationAt: Date;
    };
    coordinates: {
      active: boolean;
      rulesCount: number;
      lastValidationAt: Date;
    };
    device: {
      active: boolean;
      rulesCount: number;
      lastValidationAt: Date;
    };
    time: {
      active: boolean;
      rulesCount: number;
      lastValidationAt: Date;
    };
    size: {
      active: boolean;
      rulesCount: number;
      lastValidationAt: Date;
    };
    format: {
      active: boolean;
      rulesCount: number;
      lastValidationAt: Date;
    };
    security: {
      active: boolean;
      rulesCount: number;
      lastValidationAt: Date;
    };
    composite: {
      active: boolean;
      validatorsCount: number;
      enabledValidatorsCount: number;
      lastValidationAt: Date;
    };
  };
  timestamp: Date;
  responseTime: number;
}
