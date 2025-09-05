/**
 * Messaging Domain Interface
 *
 * This file defines the core interfaces for the Messaging domain,
 * providing contracts for message processing and communication.
 */

import { Signal, RawSignalData } from './signals.interface';

// Message Types
export type MessageType = 'signal.raw' | 'signal.processed' | 'device.status' | 'error';

// Base Message Interface
export interface BaseMessage {
  messageId: string;
  correlationId: string;
  timestamp: Date;
  messageType: MessageType;
  source: string;
  schemaVersion: string;
  idempotencyKey?: string;
}

// Raw Signal Message Interface
export interface RawSignalMessage extends BaseMessage {
  messageType: 'signal.raw';
  payload: RawSignalData;
}

// Processed Signal Message Interface
export interface ProcessedSignalMessage extends BaseMessage {
  messageType: 'signal.processed';
  payload: Signal;
}

// Device Status Message Interface
export interface DeviceStatusMessage extends BaseMessage {
  messageType: 'device.status';
  payload: {
    deviceId: string;
    status: 'online' | 'offline' | 'error' | 'maintenance';
    lastSeen: Date;
    health?: {
      battery?: number;
      signalStrength?: number;
      temperature?: number;
      uptime?: number;
      errorCount?: number;
      lastError?: string;
    };
    capabilities: {
      supportedMessageTypes: string[];
      maxPayloadSize: number;
      supportedFormats: string[];
    };
  };
}

// Error Message Interface
export interface ErrorMessage extends BaseMessage {
  messageType: 'error';
  payload: {
    errorCode: string;
    errorMessage: string;
    originalMessageId?: string;
    stackTrace?: string;
    context?: Record<string, unknown>;
  };
}

// Union type for all messages
export type Message =
  | RawSignalMessage
  | ProcessedSignalMessage
  | DeviceStatusMessage
  | ErrorMessage;

// Message Handler Interface
export interface IMessageHandler<T extends Message = Message> {
  handle(message: T): Promise<MessageProcessingResult>;
  canHandle(messageType: MessageType): boolean;
}

// Message Processing Result Interface
export interface MessageProcessingResult {
  success: boolean;
  processedAt: Date;
  processingTime: number;
  error?: string;
  retryable?: boolean;
  dlqReason?: string;
}

// Message Publisher Interface
export interface IMessagePublisher {
  publish<T extends Message>(message: T): Promise<void>;
  publishBatch<T extends Message>(messages: T[]): Promise<BatchPublishResult>;
  publishWithRetry<T extends Message>(message: T, maxRetries?: number): Promise<void>;
}

// Batch Publish Result Interface
export interface BatchPublishResult {
  successful: number;
  failed: number;
  errors: Array<{
    index: number;
    error: string;
  }>;
}

// Message Consumer Interface
export interface IMessageConsumer {
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
  getHealthStatus(): ConsumerHealthStatus;
}

// Consumer Health Status Interface
export interface ConsumerHealthStatus {
  isHealthy: boolean;
  isRunning: boolean;
  lastMessageProcessed?: Date;
  messagesProcessed: number;
  errorsCount: number;
  uptime: number;
}

// Message Validation Interface
export interface IMessageValidator {
  validate<T extends Message>(message: T): ValidationResult;
  validateSchema(message: unknown): ValidationResult;
  validateMessageType(messageType: string): boolean;
}

// Validation Result Interface
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

// Message Factory Interface
export interface IMessageFactory {
  createRawSignalMessage(payload: RawSignalData, source: string): RawSignalMessage;
  createProcessedSignalMessage(payload: Signal, source: string): ProcessedSignalMessage;
  createDeviceStatusMessage(
    payload: DeviceStatusMessage['payload'],
    source: string
  ): DeviceStatusMessage;
  createErrorMessage(error: Error, originalMessageId?: string, source?: string): ErrorMessage;
}

// Message Router Interface
export interface IMessageRouter {
  route(message: Message): Promise<void>;
  addHandler(handler: IMessageHandler): void;
  removeHandler(handler: IMessageHandler): void;
  getHandlers(messageType: MessageType): IMessageHandler[];
}
