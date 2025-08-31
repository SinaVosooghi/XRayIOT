import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@iotp/shared-config';
import { XRayRawSignal, DeviceStatusUpdate, MessageValidator } from '@iotp/shared-messaging';
import { HmacAuthService, HmacSignature } from '@iotp/shared-utils';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProducerService {
  private readonly logger = new Logger(ProducerService.name);

  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly configService: ConfigService,
    private readonly hmacAuthService: HmacAuthService
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
      // Generate HMAC signature for the message
      const hmacSignature = this.hmacAuthService.generateSignature(
        payload.deviceId,
        JSON.stringify(payload),
        payload.capturedAt
      );

      await this.amqpConnection.publish('iot.xray', 'xray.raw.v1', payload, {
        headers: {
          'x-correlation-id': correlationId,
          'x-timestamp': new Date().toISOString(),
          'x-service': 'producer',
          'x-schema-version': payload.schemaVersion || 'v1',
          // HMAC authentication headers
          'x-device-id': payload.deviceId,
          'x-hmac-signature': hmacSignature.signature,
          'x-timestamp-auth': hmacSignature.timestamp,
          'x-nonce': hmacSignature.nonce,
          'x-algorithm': hmacSignature.algorithm,
        },
      });

      this.logger.log('Message published successfully with HMAC authentication', {
        deviceId: payload.deviceId,
        correlationId,
        schemaVersion: payload.schemaVersion,
        hmacAlgorithm: hmacSignature.algorithm,
        nonce: hmacSignature.nonce,
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

    // Validate all payloads first
    for (const payload of payloads) {
      const validation = MessageValidator.validateRawSignal(payload);
      if (!validation.valid) {
        throw new Error(`Batch validation failed for device ${payload.deviceId}: ${validation.errors?.join(', ')}`);
      }
    }

    try {
      // Publish each message with HMAC authentication
      const publishPromises = payloads.map(async (payload) => {
        const hmacSignature = this.hmacAuthService.generateSignature(
          payload.deviceId,
          JSON.stringify(payload),
          payload.capturedAt
        );

        return this.amqpConnection.publish('iot.xray', 'xray.raw.v1', payload, {
          headers: {
            'x-correlation-id': correlationId,
            'x-timestamp': new Date().toISOString(),
            'x-service': 'producer',
            'x-schema-version': payload.schemaVersion || 'v1',
            // HMAC authentication headers
            'x-device-id': payload.deviceId,
            'x-hmac-signature': hmacSignature.signature,
            'x-timestamp-auth': hmacSignature.timestamp,
            'x-nonce': hmacSignature.nonce,
            'x-algorithm': hmacSignature.algorithm,
          },
        });
      });

      await Promise.all(publishPromises);

      this.logger.log('Batch published successfully with HMAC authentication', {
        count: payloads.length,
        correlationId,
        deviceIds: payloads.map(p => p.deviceId),
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
    status: 'online' | 'offline' | 'error' | 'maintenance',
    health?: Record<string, unknown>
  ): Promise<void> {
    const deviceStatus: DeviceStatusUpdate = {
      deviceId,
      status,
      lastSeen: new Date().toISOString(),
      health,
      correlationId: this.generateCorrelationId(),
    };

    // Validate device status
    const validation = MessageValidator.validateDeviceStatus(deviceStatus);
    if (!validation.valid) {
      throw new Error(`Device status validation failed: ${validation.errors?.join(', ')}`);
    }

    const correlationId = this.generateCorrelationId();

    try {
      // Generate HMAC signature for device status
      const hmacSignature = this.hmacAuthService.generateSignature(
        deviceId,
        JSON.stringify(deviceStatus)
      );

      await this.amqpConnection.publish('iot.xray', 'device.status.v1', deviceStatus, {
        headers: {
          'x-correlation-id': correlationId,
          'x-timestamp': new Date().toISOString(),
          'x-service': 'producer',
          'x-schema-version': 'v1',
          // HMAC authentication headers
          'x-device-id': deviceId,
          'x-hmac-signature': hmacSignature.signature,
          'x-timestamp-auth': hmacSignature.timestamp,
          'x-nonce': hmacSignature.nonce,
          'x-algorithm': hmacSignature.algorithm,
        },
      });

      this.logger.log('Device status published successfully with HMAC authentication', {
        deviceId,
        status,
        correlationId,
        hmacAlgorithm: hmacSignature.algorithm,
        nonce: hmacSignature.nonce,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to publish device status', {
        error: errorMessage,
        deviceId,
        status,
        correlationId,
      });
      throw error;
    }
  }

  // Validation methods for testing
  validateMessage(payload: XRayRawSignal): { valid: boolean; errors?: string[] } {
    return MessageValidator.validateRawSignal(payload);
  }

  validateRawSignal(payload: XRayRawSignal): { valid: boolean; errors?: string[] } {
    return MessageValidator.validateRawSignal(payload);
  }

  validateDeviceStatus(payload: DeviceStatusUpdate): { valid: boolean; errors?: string[] } {
    return MessageValidator.validateDeviceStatus(payload);
  }

  // HMAC signature generation for testing
  generateHmacSignature(deviceId: string, payload: string): HmacSignature {
    return this.hmacAuthService.generateSignature(deviceId, payload);
  }

  // Get HMAC configuration for testing
  getHmacConfig() {
    return this.hmacAuthService.getConfig();
  }
}
