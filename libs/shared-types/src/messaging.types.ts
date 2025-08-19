// Messaging types for RabbitMQ and message processing
import { ValidationResult } from './common.types';

// RabbitMQ Message Types
// RabbitMQMessage is imported from common.types.ts

export interface RabbitMQFields {
  deliveryTag: number;
  redelivered: boolean;
  exchange: string;
  routingKey: string;
  queue?: string;
  consumerTag?: string;
}

export interface RabbitMQProperties {
  contentType?: string;
  contentEncoding?: string;
  headers?: Record<string, unknown>;
  deliveryMode?: number;
  priority?: number;
  correlationId?: string;
  replyTo?: string;
  expiration?: string;
  messageId?: string;
  timestamp?: number;
  type?: string;
  userId?: string;
  appId?: string;
  clusterId?: string;
  persistent?: boolean;
}

// Message Processing Types
export interface MessageProcessor<T = unknown> {
  process(message: T): Promise<MessageProcessingResult>;
  validate(message: T): ValidationResult;
  transform(message: T): T;
}

export interface MessageProcessingResult {
  success: boolean;
  messageId?: string;
  deviceId?: string;
  processingTime: number;
  error?: string;
  retryable: boolean;
  retryCount: number;
  maxRetries: number;
}

// ValidationResult is imported from common.types.ts

// Message Queue Types
export interface MessageQueue {
  name: string;
  durable: boolean;
  autoDelete: boolean;
  arguments?: Record<string, unknown>;
}

export interface MessageExchange {
  name: string;
  type: 'direct' | 'fanout' | 'topic' | 'headers';
  durable: boolean;
  autoDelete: boolean;
  arguments?: Record<string, unknown>;
}

export interface MessageBinding {
  source: string;
  destination: string;
  destinationType: 'queue' | 'exchange';
  routingKey: string;
  arguments?: Record<string, unknown>;
}

export interface MessageRouting {
  exchange: string;
  routingKey: string;
  mandatory?: boolean;
  immediate?: boolean;
}

// Message Handler Types
export interface MessageHandler<T = unknown> {
  handle(message: T): Promise<void>;
  handleError(error: Error, message: T): Promise<void>;
  handleRetry(message: T, retryCount: number): Promise<boolean>;
}

export interface MessageHandlerOptions {
  autoAck: boolean;
  prefetchCount: number;
  retryAttempts: number;
  retryDelay: number;
  deadLetterExchange?: string;
  deadLetterRoutingKey?: string;
  messageTtl?: number;
  maxPriority?: number;
}

// Message Consumer Types
export interface MessageConsumer<T = unknown> {
  consume(queue: string, handler: MessageHandler<T>): Promise<void>;
  stop(): Promise<void>;
  isConsuming(): boolean;
  getQueueInfo(queue: string): Promise<QueueInfo>;
}

export interface QueueInfo {
  name: string;
  messages: number;
  consumers: number;
  state: 'idle' | 'running' | 'stopped';
}

// Message Producer Types
export interface MessageProducer {
  publish(
    exchange: string,
    routingKey: string,
    message: Buffer | string | object,
    options?: PublishOptions
  ): Promise<boolean>;

  publishBatch(
    exchange: string,
    messages: Array<{
      routingKey: string;
      message: Buffer | string | object;
      options?: PublishOptions;
    }>
  ): Promise<boolean[]>;

  confirmSelect(): Promise<void>;
  waitForConfirms(timeout?: number): Promise<boolean>;
}

export interface PublishOptions {
  mandatory?: boolean;
  immediate?: boolean;
  persistent?: boolean;
  priority?: number;
  expiration?: number;
  userId?: string;
  appId?: string;
  messageId?: string;
  correlationId?: string;
  replyTo?: string;
  type?: string;
  headers?: Record<string, unknown>;
}

// Message Serialization Types
export interface MessageSerializer<T = unknown> {
  serialize(message: T): Buffer;
  deserialize(data: Buffer): T;
  getContentType(): string;
}

export interface MessageDeserializer<T = unknown> {
  deserialize(data: Buffer): T;
  canDeserialize(contentType: string): boolean;
}

// Message Validation Types
export interface MessageValidator<T = unknown> {
  validate(message: T): ValidationResult;
  validateSchema(message: T, schema: unknown): ValidationResult;
  validateBusinessRules(message: T): ValidationResult;
}

// Message Transformation Types
export interface MessageTransformer<T = unknown, U = unknown> {
  transform(message: T): U;
  canTransform(from: T, to: U): boolean;
}

// Message Dead Letter Types
export interface DeadLetterConfig {
  exchange: string;
  routingKey: string;
  maxRetries: number;
  ttl: number;
}

export interface DeadLetterMessage<T = unknown> {
  originalMessage: T;
  originalQueue: string;
  originalExchange: string;
  originalRoutingKey: string;
  deadLetterReason: string;
  deadLetterTime: Date;
  retryCount: number;
  maxRetries: number;
}

// Message Metrics Types
export interface MessageMetrics {
  totalMessages: number;
  processedMessages: number;
  failedMessages: number;
  retriedMessages: number;
  averageProcessingTime: number;
  messagesPerSecond: number;
  queueDepth: number;
  consumerCount: number;
  lastMessageAt: Date;
  lastErrorAt?: Date;
}

export interface QueueMetrics {
  queueName: string;
  messageCount: number;
  consumerCount: number;
  memoryUsage: number;
  diskUsage: number;
  messageRate: number;
  consumerUtilization: number;
}

// Message Health Check Types
export interface MessageHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  details: {
    connection: boolean;
    exchanges: Record<string, boolean>;
    queues: Record<string, QueueInfo>;
    consumers: Record<string, boolean>;
    producers: Record<string, boolean>;
  };
  timestamp: Date;
  responseTime: number;
}

// Message Configuration Types
export interface MessageConfig {
  rabbitmq: {
    uri: string;
    exchanges: MessageExchange[];
    queues: MessageQueue[];
    bindings: MessageBinding[];
    options: {
      heartbeat: number;
      connectionTimeout: number;
      channelMax: number;
      frameMax: number;
    };
  };
  processing: {
    autoAck: boolean;
    prefetchCount: number;
    retryAttempts: number;
    retryDelay: number;
    maxProcessingTime: number;
    enableDeadLetter: boolean;
    deadLetterConfig?: DeadLetterConfig;
  };
  monitoring: {
    enableMetrics: boolean;
    enableHealthChecks: boolean;
    metricsInterval: number;
    healthCheckInterval: number;
  };
}

// Message Event Types
export interface MessageEvent<T = unknown> {
  type: 'received' | 'processed' | 'failed' | 'retried' | 'deadLettered';
  message: T;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface MessageEventListener<T = unknown> {
  onMessageReceived(event: MessageEvent<T>): void;
  onMessageProcessed(event: MessageEvent<T>): void;
  onMessageFailed(event: MessageEvent<T>): void;
  onMessageRetried(event: MessageEvent<T>): void;
  onMessageDeadLettered(event: MessageEvent<T>): void;
}

// Message Idempotency Types

// Message Idempotency Types
export interface IdempotencyKey {
  key: string;
  messageHash: string;
  timestamp: Date;
  ttl: number;
}

export interface IdempotencyChecker {
  isProcessed(key: string): Promise<boolean>;
  markProcessed(key: string, messageHash: string): Promise<void>;
  cleanup(): Promise<void>;
}

// Message Correlation Types
export interface CorrelationContext {
  correlationId: string;
  requestId: string;
  userId?: string;
  sessionId?: string;
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
  metadata?: Record<string, unknown>;
}

export interface CorrelationTracker {
  getCorrelationId(): string;
  setCorrelationId(id: string): void;
  getRequestId(): string;
  setRequestId(id: string): void;
  getContext(): CorrelationContext;
  setContext(context: Partial<CorrelationContext>): void;
}
