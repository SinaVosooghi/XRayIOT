// Producer app specific types
import { XRayDataTuple, XRayPayloadAllFormats } from '@iotp/shared-types';

// Message publishing types
export interface PublishOptions {
  exchange: string;
  routingKey: string;
  priority?: number;
  persistent?: boolean;
  expiration?: number;
  headers?: Record<string, unknown>;
}

export interface PublishResult {
  success: boolean;
  messageId?: string;
  timestamp: number;
  exchange: string;
  routingKey: string;
}

export interface BatchPublishResult {
  totalMessages: number;
  successfulPublishes: number;
  failedPublishes: number;
  errors: Array<{
    message: XRayPayloadAllFormats;
    error: string;
    timestamp: number;
  }>;
}

// Testing and continuous operation types
export interface ContinuousTestingConfig {
  intervalMs: number;
  maxMessages?: number;
  stopOnError?: boolean;
  retryOnFailure?: boolean;
  maxRetries?: number;
}

export interface ContinuousTestingStatus {
  isRunning: boolean;
  startTime?: Date;
  messagesSent: number;
  errors: number;
  lastError?: string;
  lastMessageTime?: Date;
  intervalId?: ReturnType<typeof setInterval> | null;
}

export interface TestDataConfig {
  deviceCount: number;
  messageFrequency: number;
  dataFormat: 'original' | 'signals' | 'legacy' | 'random';
  coordinatesRange: {
    lat: { min: number; max: number };
    lon: { min: number; max: number };
    altitude: { min: number; max: number };
  };
  timestampRange: {
    start: number;
    end: number;
  };
}

// Error handling types
export interface ProducerError extends Error {
  code: string;
  context: {
    operation: string;
    message?: XRayPayloadAllFormats;
    timestamp: number;
    retryCount?: number;
  };
}

export interface ErrorHandlingConfig {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  circuitBreaker: boolean;
  circuitBreakerThreshold: number;
}

// Metrics and monitoring types
export interface ProducerMetrics {
  messagesPublished: number;
  messagesFailed: number;
  averagePublishTime: number;
  lastPublishTime?: Date;
  uptime: number;
  errors: Array<{
    type: string;
    count: number;
    lastOccurrence: Date;
  }>;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    amqpConnection: boolean;
    messagePublishing: boolean;
    continuousTesting: boolean;
  };
  details: {
    amqpConnection: string;
    messagePublishing: string;
    continuousTesting: string;
  };
}

// Configuration types
export interface ProducerConfig {
  amqp: {
    exchange: string;
    routingKey: string;
    connectionTimeout: number;
    heartbeat: number;
  };
  testing: {
    defaultInterval: number;
    maxBatchSize: number;
    retryAttempts: number;
  };
  monitoring: {
    enableMetrics: boolean;
    healthCheckInterval: number;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

// Service interface types
export interface IProducerService {
  sendTestData(): Promise<void>;
  publishMessage(
    message: XRayPayloadAllFormats,
    options?: Partial<PublishOptions>
  ): Promise<PublishResult>;
  publishBatch(
    messages: XRayPayloadAllFormats[],
    options?: Partial<PublishOptions>
  ): Promise<BatchPublishResult>;
  startContinuousTesting(config?: Partial<ContinuousTestingConfig>): void;
  stopContinuousTesting(): void;
  isContinuousTestingRunning(): boolean;
  getContinuousTestingStatus(): ContinuousTestingStatus;
  getMetrics(): ProducerMetrics;
  getHealthCheck(): HealthCheckResult;
}

// Event types
export interface ProducerEvent {
  type:
    | 'message_published'
    | 'message_failed'
    | 'testing_started'
    | 'testing_stopped'
    | 'error_occurred';
  timestamp: Date;
  data: Record<string, unknown>;
}

export interface MessagePublishedEvent extends ProducerEvent {
  type: 'message_published';
  data: {
    messageId: string;
    exchange: string;
    routingKey: string;
    message: XRayPayloadAllFormats;
  };
}

export interface TestingEvent extends ProducerEvent {
  type: 'testing_started' | 'testing_stopped';
  data: {
    config: ContinuousTestingConfig;
    status: ContinuousTestingStatus;
  };
}

export interface TestFormat {
  name: string;
  data: Record<
    string,
    {
      data: XRayDataTuple[];
      time: number;
    }
  >;
}
