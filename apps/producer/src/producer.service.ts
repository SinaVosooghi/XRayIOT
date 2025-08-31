import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@iotp/shared-config';
import { v4 as uuidv4 } from 'uuid';
import { MessageValidator, XRayRawSignal } from '@iotp/shared-messaging';

@Injectable()
export class ProducerService {
  private readonly logger = new Logger(ProducerService.name);

  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly configService: ConfigService
  ) {}

  private generateCorrelationId(): string {
    return uuidv4();
  }

  async publishMessage(payload: XRayRawSignal): Promise<void> {
    // Validate payload against JSON Schema
    const validation = MessageValidator.validateRawSignal(payload);

    if (!validation.valid) {
      this.logger.error('Message validation failed', {
        errors: validation.errors,
        payload: payload,
      });
      throw new Error(`Message validation failed: ${validation.errors?.join(', ')}`);
    }

    const correlationId = this.generateCorrelationId();

    try {
      await this.amqpConnection.publish('iot.xray', 'xray.raw.v1', payload, {
        headers: {
          'x-correlation-id': correlationId,
          'x-timestamp': new Date().toISOString(),
          'x-service': 'producer',
          'x-schema-version': payload.schemaVersion || 'v1',
        },
      });

      this.logger.log('Message published successfully', {
        deviceId: payload.deviceId,
        correlationId,
        schemaVersion: payload.schemaVersion,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to publish message', {
        error: errorMessage,
        deviceId: payload.deviceId,
        correlationId,
      });
      throw error;
    }
  }

  async publishBatch(payloads: XRayRawSignal[]): Promise<void> {
    const correlationId = this.generateCorrelationId();

    this.logger.log('Publishing batch of messages', {
      count: payloads.length,
      correlationId,
    });

    // Validate all payloads before publishing
    const validationResults = payloads.map((payload, index) => ({
      index,
      payload,
      validation: MessageValidator.validateRawSignal(payload),
    }));

    const invalidMessages = validationResults.filter(result => !result.validation.valid);

    if (invalidMessages.length > 0) {
      this.logger.error('Batch validation failed', {
        total: payloads.length,
        invalid: invalidMessages.length,
        errors: invalidMessages.map(msg => ({
          index: msg.index,
          errors: msg.validation.errors,
        })),
      });
      throw new Error(`Batch validation failed: ${invalidMessages.length} invalid messages`);
    }

    try {
      const publishPromises = payloads.map(async (payload, index) => {
        const messageCorrelationId = `${correlationId}-${index}`;

        await this.amqpConnection.publish('iot.xray', 'xray.raw.v1', payload, {
          headers: {
            'x-correlation-id': messageCorrelationId,
            'x-timestamp': new Date().toISOString(),
            'x-service': 'producer',
            'x-batch-id': correlationId,
            'x-batch-index': index,
            'x-schema-version': payload.schemaVersion || 'v1',
          },
        });
      });

      await Promise.all(publishPromises);

      this.logger.log('Batch published successfully', {
        count: payloads.length,
        correlationId,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to publish batch', {
        error: errorMessage,
        count: payloads.length,
        correlationId,
      });
      throw error;
    }
  }

  async publishDeviceStatus(
    deviceId: string,
    status: string,
    health?: Record<string, unknown>
  ): Promise<void> {
    const payload = {
      deviceId,
      status,
      lastSeen: new Date().toISOString(),
      health,
      schemaVersion: 'v1' as const,
      correlationId: this.generateCorrelationId(),
    };

    // Validate device status payload
    const validation = MessageValidator.validateDeviceStatus(payload);

    if (!validation.valid) {
      this.logger.error('Device status validation failed', {
        errors: validation.errors,
        payload,
      });
      throw new Error(`Device status validation failed: ${validation.errors?.join(', ')}`);
    }

    try {
      await this.amqpConnection.publish('iot.xray', 'device.status.v1', payload, {
        headers: {
          'x-correlation-id': payload.correlationId,
          'x-timestamp': new Date().toISOString(),
          'x-service': 'producer',
          'x-schema-version': payload.schemaVersion,
        },
      });

      this.logger.log('Device status published successfully', {
        deviceId,
        status,
        correlationId: payload.correlationId,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to publish device status', {
        error: errorMessage,
        deviceId,
        status,
      });
      throw error;
    }
  }

  // Validation methods for testing
  validateMessage(message: unknown): { valid: boolean; errors?: string[] } {
    return MessageValidator.validateRawSignal(message);
  }

  validateRawSignal(message: unknown): { valid: boolean; errors?: string[] } {
    return MessageValidator.validateRawSignal(message);
  }

  validateDeviceStatus(message: unknown): { valid: boolean; errors?: string[] } {
    return MessageValidator.validateDeviceStatus(message);
  }
}
