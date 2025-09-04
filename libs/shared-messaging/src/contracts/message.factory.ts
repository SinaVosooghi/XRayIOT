/**
 * Message Factory Service
 *
 * This service provides utilities for creating properly formatted message contracts
 * with automatic idempotency key generation, correlation ID propagation, and
 * schema versioning.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  MessageContract,
  XRayRawMessageContract,
  XRayProcessedMessageContract,
  DeviceStatusMessageContract,
  ErrorMessageContract,
  MESSAGE_TYPES,
  SCHEMA_VERSIONS,
} from './message.contract';

export class MessageFactory {
  /**
   * Generate a unique idempotency key based on message content
   */
  static generateIdempotencyKey(content: Record<string, unknown>): string {
    const contentString = JSON.stringify(content, Object.keys(content).sort());
    // Simple hash function - in production, use proper crypto
    let hash = 0;
    for (let i = 0; i < contentString.length; i++) {
      const char = contentString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `idemp_${hash.toString(16)}_${Date.now()}`;
  }

  /**
   * Generate a correlation ID for request tracing
   */
  static generateCorrelationId(): string {
    return uuidv4();
  }

  /**
   * Create an X-Ray raw message contract
   */
  static createXRayRawMessage(
    deviceId: string,
    capturedAt: string,
    payload: string,
    metadata?: XRayRawMessageContract['metadata'],
    correlationId?: string
  ): XRayRawMessageContract {
    const content = { deviceId, capturedAt, payload, metadata };

    return {
      messageType: MESSAGE_TYPES.XRAY_RAW,
      schemaVersion: SCHEMA_VERSIONS.V1_1,
      idempotencyKey: this.generateIdempotencyKey(content),
      correlationId: correlationId || this.generateCorrelationId(),
      createdAt: new Date().toISOString(),
      deviceId,
      capturedAt,
      payload,
      metadata,
    };
  }

  /**
   * Create an X-Ray processed message contract
   */
  static createXRayProcessedMessage(
    deviceId: string,
    processedAt: string,
    originalPayload: string,
    processedData: XRayProcessedMessageContract['processedData'],
    processingMetadata: XRayProcessedMessageContract['processingMetadata'],
    correlationId?: string
  ): XRayProcessedMessageContract {
    const content = { deviceId, processedAt, originalPayload, processedData, processingMetadata };

    return {
      messageType: MESSAGE_TYPES.XRAY_PROCESSED,
      schemaVersion: SCHEMA_VERSIONS.V1_1,
      idempotencyKey: this.generateIdempotencyKey(content),
      correlationId: correlationId || this.generateCorrelationId(),
      createdAt: new Date().toISOString(),
      deviceId,
      processedAt,
      originalPayload,
      processedData,
      processingMetadata,
    };
  }

  /**
   * Create a device status message contract
   */
  static createDeviceStatusMessage(
    deviceId: string,
    status: DeviceStatusMessageContract['status'],
    lastSeen: string,
    health?: DeviceStatusMessageContract['health'],
    capabilities?: DeviceStatusMessageContract['capabilities'],
    correlationId?: string
  ): DeviceStatusMessageContract {
    const content = { deviceId, status, lastSeen, health, capabilities };

    return {
      messageType: MESSAGE_TYPES.DEVICE_STATUS,
      schemaVersion: SCHEMA_VERSIONS.V1_1,
      idempotencyKey: this.generateIdempotencyKey(content),
      correlationId: correlationId || this.generateCorrelationId(),
      createdAt: new Date().toISOString(),
      deviceId,
      status,
      lastSeen,
      health,
      capabilities: capabilities || {
        supportedMessageTypes: [MESSAGE_TYPES.XRAY_RAW],
        maxPayloadSize: 1048576, // 1MB
        supportedProtocols: ['mqtt', 'amqp'],
      },
    };
  }

  /**
   * Create an error message contract
   */
  static createErrorMessage(
    error: ErrorMessageContract['error'],
    originalMessage?: ErrorMessageContract['originalMessage'],
    correlationId?: string
  ): ErrorMessageContract {
    const content = { error, originalMessage };

    return {
      messageType: MESSAGE_TYPES.ERROR,
      schemaVersion: SCHEMA_VERSIONS.V1_0,
      idempotencyKey: this.generateIdempotencyKey(content),
      correlationId: correlationId || this.generateCorrelationId(),
      createdAt: new Date().toISOString(),
      error,
      originalMessage,
    };
  }

  /**
   * Propagate correlation ID from one message to another
   */
  static propagateCorrelationId(
    sourceMessage: MessageContract,
    targetMessage: Omit<MessageContract, 'correlationId'>
  ): MessageContract {
    return {
      ...targetMessage,
      correlationId: sourceMessage.correlationId,
    } as MessageContract;
  }

  /**
   * Validate message contract structure
   */
  static validateMessageContract(message: unknown): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!message || typeof message !== 'object') {
      errors.push('Message must be an object');
      return { valid: false, errors };
    }

    const msg = message as Record<string, unknown>;

    // Required fields
    if (!msg.schemaVersion || typeof msg.schemaVersion !== 'string') {
      errors.push('schemaVersion is required and must be a string');
    }

    if (!msg.idempotencyKey || typeof msg.idempotencyKey !== 'string') {
      errors.push('idempotencyKey is required and must be a string');
    }

    if (!msg.correlationId || typeof msg.correlationId !== 'string') {
      errors.push('correlationId is required and must be a string');
    }

    if (!msg.createdAt || typeof msg.createdAt !== 'string') {
      errors.push('createdAt is required and must be a string');
    }

    if (!msg.messageType || typeof msg.messageType !== 'string') {
      errors.push('messageType is required and must be a string');
    }

    // Validate schema version
    if (msg.schemaVersion && !['v1.0', 'v1.1'].includes(msg.schemaVersion as string)) {
      errors.push('schemaVersion must be v1.0 or v1.1');
    }

    // Validate message type
    if (
      msg.messageType &&
      !Object.values(MESSAGE_TYPES).includes(
        msg.messageType as (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES]
      )
    ) {
      errors.push('messageType must be a valid message type');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
