// Processing types for the Signals app
import { XRayPayloadAllFormats, ValidationResult } from '@iotp/shared-types';

// Message Processing Pipeline
export interface MessageProcessingPipeline {
  stages: MessageProcessingStage[];
  execute(message: XRayPayloadAllFormats): Promise<MessageProcessingStageResult>;
  addStage(stage: MessageProcessingStage): void;
  removeStage(stageName: string): void;
  getStage(stageName: string): MessageProcessingStage | undefined;
}

export interface MessageProcessingStage {
  name: string;
  description: string;
  order: number;
  enabled: boolean;
  execute(
    message: XRayPayloadAllFormats,
    context: MessageProcessingContext
  ): Promise<MessageProcessingStageResult>;
  validate(message: XRayPayloadAllFormats): ValidationResult;
}

export interface MessageProcessingStageResult {
  success: boolean;
  output: XRayPayloadAllFormats;
  metadata?: Record<string, unknown>;
  error?: string;
  executionTime: number;
}

// Message Processing Context
export interface MessageProcessingContext {
  messageId: string;
  deviceId: string;
  timestamp: number;
  startTime: number;
  stageResults: Map<string, MessageProcessingStageResult>;
  metadata: Record<string, unknown>;
  retryCount: number;
  maxRetries: number;
}

// Message Validation

// ValidationResult is imported from @iotp/shared-types

// Message Transformation

export interface TransformationStep {
  name: string;
  description: string;
  transform(input: unknown): unknown;
  canTransform(input: unknown): boolean;
}

// Message Normalization
export interface MessageNormalizer {
  normalize(message: XRayPayloadAllFormats): XRayPayloadAllFormats;
  isNormalized(message: XRayPayloadAllFormats): boolean;
  getNormalizationRules(): NormalizationRule[];
}

export interface NormalizationRule {
  name: string;
  description: string;
  condition: (message: XRayPayloadAllFormats) => boolean;
  transform: (message: XRayPayloadAllFormats) => XRayPayloadAllFormats;
}

// Message Enrichment
export interface MessageEnricher {
  enrich(message: XRayPayloadAllFormats): Promise<EnrichedMessage>;
  getEnrichmentSources(): EnrichmentSource[];
}

export interface EnrichmentSource {
  name: string;
  description: string;
  enabled: boolean;
  enrich(message: XRayPayloadAllFormats): Promise<Record<string, unknown>>;
}

export interface EnrichedMessage {
  message: XRayPayloadAllFormats;
  enrichment: Record<string, unknown>;
  enrichmentTimestamp: Date;
  enrichmentSources: string[];
}

// Message Deduplication
export interface MessageDeduplicator {
  isDuplicate(message: XRayPayloadAllFormats): Promise<boolean>;
  markProcessed(message: XRayPayloadAllFormats): Promise<void>;
  getDuplicateKey(message: XRayPayloadAllFormats): string;
}

export interface DeduplicationConfig {
  enabled: boolean;
  keyFields: string[];
  ttl: number;
  strategy: 'hash' | 'fields' | 'custom';
}

export interface RoutingRule {
  name: string;
  condition: (message: XRayPayloadAllFormats) => boolean;
  route: MessageRoute;
  priority: number;
}

export interface MessageRoute {
  exchange: string;
  routingKey: string;
  options?: Record<string, unknown>;
}

// Message Batching
export interface MessageBatcher {
  addMessage(message: XRayPayloadAllFormats): void;
  getBatch(): MessageBatch | null;
  isBatchReady(): boolean;
  getBatchSize(): number;
  getBatchTimeout(): number;
}

export interface MessageBatch {
  id: string;
  messages: XRayPayloadAllFormats[];
  timestamp: Date;
  size: number;
}

export interface BatchProcessor {
  processBatch(batch: MessageBatch): Promise<BatchProcessingResult>;
  getBatchSize(): number;
  getBatchTimeout(): number;
}

export interface BatchProcessingResult {
  success: boolean;
  batchId: string;
  processedCount: number;
  failedCount: number;
  errors: string[];
  processingTime: number;
}

// Message Priority
export interface MessagePrioritizer {
  getPriority(message: XRayPayloadAllFormats): number;
  setPriority(message: XRayPayloadAllFormats, priority: number): void;
  getPriorityLevels(): number[];
}

export interface PriorityMessage {
  message: XRayPayloadAllFormats;
  priority: number;
  priorityTimestamp: Date;
}

// Message Rate Limiting
export interface MessageRateLimiter {
  canProcess(message: XRayPayloadAllFormats): boolean;
  recordProcessing(message: XRayPayloadAllFormats): void;
  getCurrentRate(): number;
  getLimit(): number;
  getWindow(): number;
}

export interface RateLimitConfig {
  limit: number;
  window: number;
  strategy: 'token-bucket' | 'leaky-bucket' | 'fixed-window' | 'sliding-window';
}

// Message Circuit Breaker
export interface MessageCircuitBreaker {
  canProcess(message: XRayPayloadAllFormats): boolean;
  recordSuccess(message: XRayPayloadAllFormats): void;
  recordFailure(message: XRayPayloadAllFormats, error: Error): void;
  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  getFailureCount(): number;
  getLastFailureTime(): Date;
  reset(): void;
}

export interface CircuitBreakerConfig {
  threshold: number;
  timeout: number;
  halfOpenThreshold: number;
}

// Message Retry
export interface MessageRetryHandler {
  shouldRetry(message: XRayPayloadAllFormats, error: Error): boolean;
  getRetryDelay(message: XRayPayloadAllFormats, retryCount: number): number;
  getMaxRetries(message: XRayPayloadAllFormats): number;
  isRetryableError(error: Error): boolean;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

// Message Metrics
export interface MessageProcessingMetrics {
  totalProcessed: number;
  totalErrors: number;
  totalRetries: number;
  averageProcessingTime: number;
  averageStageTime: Record<string, number>;
  errorRate: number;
  retryRate: number;
  lastProcessedAt: Date;
  lastErrorAt?: Date;
}

export interface StageMetrics {
  stageName: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  lastExecutionAt: Date;
  errorRate: number;
}

// Message Health Check
export interface MessageProcessingHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  details: {
    pipeline: {
      active: boolean;
      stageCount: number;
      enabledStages: number;
    };
    processing: {
      active: boolean;
      queueSize: number;
      lastProcessedAt: Date;
    };
    validation: {
      active: boolean;
      rulesCount: number;
      lastValidationAt: Date;
    };
    transformation: {
      active: boolean;
      stepsCount: number;
      lastTransformationAt: Date;
    };
    enrichment: {
      active: boolean;
      sourcesCount: number;
      lastEnrichmentAt: Date;
    };
  };
  timestamp: Date;
  responseTime: number;
}

// Message Configuration
export interface MessageProcessingConfig {
  pipeline: {
    stages: Array<{
      name: string;
      enabled: boolean;
      order: number;
      config: Record<string, unknown>;
    }>;
  };
  validation: {
    enabled: boolean;
    rules: Array<{
      name: string;
      enabled: boolean;
      severity: 'error' | 'warning' | 'info';
    }>;
  };
  transformation: {
    enabled: boolean;
    steps: Array<{
      name: string;
      enabled: boolean;
      order: number;
    }>;
  };
  enrichment: {
    enabled: boolean;
    sources: Array<{
      name: string;
      enabled: boolean;
      timeout: number;
    }>;
  };
  deduplication: DeduplicationConfig;
  routing: {
    enabled: boolean;
    rules: Array<{
      name: string;
      enabled: boolean;
      priority: number;
    }>;
  };
  batching: {
    enabled: boolean;
    batchSize: number;
    batchTimeout: number;
  };
  priority: {
    enabled: boolean;
    levels: number[];
  };
  rateLimiting: RateLimitConfig;
  circuitBreaker: CircuitBreakerConfig;
  retry: RetryConfig;
  monitoring: {
    enableMetrics: boolean;
    enableHealthChecks: boolean;
    metricsInterval: number;
    healthCheckInterval: number;
  };
}
