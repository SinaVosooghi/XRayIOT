import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { XRay } from './xray.schema';
import { IRawStore } from '../raw/interfaces';
import {
  validateMessage,
  generateIdempotencyKey,
  normalizeXRayPayload,
} from '@iotp/shared-messaging';
import { ErrorHandlingService } from '../error-handling/error-handling.service';
import { XRayDocument, RawPayload } from '../types';
import { ProcessingContext } from '../types';
import { LegacyPayload } from '@iotp/shared-messaging';

@Injectable()
export class XRayConsumer {
  private readonly logger = new Logger(XRayConsumer.name);

  constructor(
    @InjectModel(XRay.name) private readonly xrayModel: Model<XRayDocument>,
    @Inject('IRawStore') private readonly rawStore: IRawStore,
    private readonly errorHandlingService: ErrorHandlingService
  ) {}

  @RabbitSubscribe({
    exchange: 'iot.xray',
    routingKey: 'xray.raw.v1',
    queue: 'xray.raw.v1',
    queueOptions: {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'iot.xray.dlx',
        'x-dead-letter-routing-key': 'xray.raw.v1.dlq',
        'x-message-ttl': 3600000, // 1 hour
      },
    },
    errorHandler: (channel, msg, error) => {
      // Custom error handling for failed messages
      const retryCount = (msg.properties.headers?.['x-retry-count'] as number) || 0;

      if (retryCount < 3) {
        // Send to retry queue
        channel.publish('iot.xray.dlx', 'xray.raw.v1.retry', msg.content, {
          headers: {
            ...msg.properties.headers,
            'x-retry-count': retryCount + 1,
          },
        });
        channel.ack(msg);
      } else {
        // Send to DLQ
        channel.publish('iot.xray.dlx', 'xray.raw.v1.dlq', msg.content, {
          headers: {
            ...msg.properties.headers,
            'x-error': error instanceof Error ? error.message : String(error),
            'x-final-retry': true,
          },
        });
        channel.ack(msg);
      }
    },
  })
  async processMessage(
    message: LegacyPayload,
    amqpMsg: { properties: { messageId?: string; headers?: Record<string, unknown> } }
  ): Promise<void> {
    const messageId = amqpMsg.properties.messageId || 'unknown';
    const deviceId = this.extractDeviceId(message);
    const correlationId = (amqpMsg.properties.headers?.['x-correlation-id'] as string) || 'unknown';

    // Add correlation ID to all logs
    this.logger.log(`Processing message with correlation ID: ${correlationId}`);

    // Note: processingContext is defined but not currently used
    // It can be used for future error handling enhancements
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _processingContext: ProcessingContext = {
      id: messageId,
      messageId: messageId,
      deviceId: deviceId,
      timestamp: new Date(),
      retryCount: 0,
      startTime: Date.now(),
    };

    try {
      const result = await this.errorHandlingService.withRetry(
        async () => {
          this.logger.log(`Processing message: ${messageId} for device: ${deviceId}`);

          // Validate message
          const validationResult = validateMessage(message);
          if (!validationResult.valid) {
            this.logger.error(`Invalid message: ${validationResult.errors.join(', ')}`);
            return false;
          }

          // Normalize the payload
          const normalized = normalizeXRayPayload(message);

          // Generate idempotency key
          const idempotencyKey = generateIdempotencyKey(message);

          // Check if already processed
          const existing = await this.xrayModel.findOne({ idempotencyKey });
          if (existing) {
            this.logger.log(`Message already processed: ${idempotencyKey}`);
            return true;
          }

          // Store raw payload
          const rawRef = await this.rawStore.store(normalized as unknown as RawPayload);

          // Calculate required fields
          const dataLength = normalized.data ? normalized.data.length : 0;
          const dataVolume = JSON.stringify(message).length;

          // Convert time to Date if it's a number
          const time =
            typeof normalized.time === 'number' ? new Date(normalized.time) : normalized.time;

          // Calculate location from first data point if available
          let location;
          if (normalized.data && normalized.data.length > 0) {
            const firstPoint = normalized.data[0];
            location = {
              type: 'Point' as const,
              coordinates: [firstPoint.lon, firstPoint.lat] as [number, number],
            };
          }

          // Create signal record
          const signal = new this.xrayModel({
            deviceId: normalized.deviceId,
            time,
            dataLength,
            dataVolume,
            rawRef,
            idempotencyKey,
            location,
          });

          await signal.save();
          this.logger.log(`Processed X-Ray data: ${signal._id?.toString() || 'unknown'}`);

          return true;
        },
        'processXRayMessage',
        { messageId, deviceId }
      );

      // Log the result but don't return it
      if (result) {
        this.logger.log('Message processed successfully');
      } else {
        this.logger.warn('Message processing failed or was skipped');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Unexpected error in message processing:', errorMessage);
    }
  }

  private extractDeviceId(message: LegacyPayload): string {
    if (typeof message === 'object' && message !== null) {
      // Legacy format: {"<deviceId>": { data, time }}
      const entries = Object.entries(message);
      if (entries.length === 1) {
        return entries[0][0];
      }
    }
    return 'unknown';
  }
}
