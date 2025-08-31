import { Test, TestingModule } from '@nestjs/testing';
import { ProducerService } from './producer.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@iotp/shared-config';
import { XRayRawSignal } from '@iotp/shared-messaging';

describe('ProducerService', () => {
  let service: ProducerService;
  let mockAmqpConnection: jest.Mocked<AmqpConnection>;

  const mockValidPayload: XRayRawSignal = {
    deviceId: 'test-device-001',
    capturedAt: new Date().toISOString(),
    payload: 'base64-encoded-payload',
    schemaVersion: 'v1',
    metadata: {
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        altitude: 10,
      },
      battery: 85,
      signalStrength: -65,
    },
  };

  const mockInvalidPayload = {
    deviceId: '', // Invalid: empty string
    // Missing required fields: capturedAt, payload, schemaVersion
    metadata: {
      location: {
        latitude: 200, // Invalid: out of range
        longitude: 200, // Invalid: out of range
      },
    },
  };

  beforeEach(async () => {
    const mockAmqpConnectionProvider = {
      provide: AmqpConnection,
      useValue: {
        publish: jest.fn(),
        connected: true,
      },
    };

    const mockConfigServiceProvider = {
      provide: ConfigService,
      useValue: {
        get: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ProducerService, mockAmqpConnectionProvider, mockConfigServiceProvider],
    }).compile();

    service = module.get<ProducerService>(ProducerService);
    mockAmqpConnection = module.get(AmqpConnection);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('publishMessage', () => {
    it('should publish a valid message successfully', async () => {
      mockAmqpConnection.publish.mockResolvedValue(undefined as any);

      await service.publishMessage(mockValidPayload);

      expect(mockAmqpConnection.publish).toHaveBeenCalledWith(
        'iot.xray',
        'xray.raw.v1',
        mockValidPayload,
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-correlation-id': expect.any(String),
            'x-timestamp': expect.any(String),
            'x-service': 'producer',
            'x-schema-version': 'v1',
          }),
        })
      );
    });

    it('should reject invalid messages', async () => {
      await expect(service.publishMessage(mockInvalidPayload as XRayRawSignal)).rejects.toThrow(
        'Message validation failed'
      );

      expect(mockAmqpConnection.publish).not.toHaveBeenCalled();
    });

    it('should handle publishing errors', async () => {
      const error = new Error('Connection failed');
      mockAmqpConnection.publish.mockRejectedValue(error);

      await expect(service.publishMessage(mockValidPayload)).rejects.toThrow('Connection failed');

      expect(mockAmqpConnection.publish).toHaveBeenCalled();
    });

    it('should generate unique correlation IDs for each message', async () => {
      mockAmqpConnection.publish.mockResolvedValue(undefined as any);

      await service.publishMessage(mockValidPayload);
      await service.publishMessage(mockValidPayload);

      const calls = mockAmqpConnection.publish.mock.calls;
      const correlationId1 = calls[0]?.[3]?.headers?.['x-correlation-id'];
      const correlationId2 = calls[1]?.[3]?.headers?.['x-correlation-id'];

      expect(correlationId1).toBeDefined();
      expect(correlationId2).toBeDefined();
      expect(correlationId1).not.toBe(correlationId2);
    });
  });

  describe('publishBatch', () => {
    const mockBatchPayloads: XRayRawSignal[] = [
      { ...mockValidPayload, deviceId: 'device-1' },
      { ...mockValidPayload, deviceId: 'device-2' },
      { ...mockValidPayload, deviceId: 'device-3' },
    ];

    it('should publish a batch of valid messages successfully', async () => {
      mockAmqpConnection.publish.mockResolvedValue(undefined as any);

      await service.publishBatch(mockBatchPayloads);

      expect(mockAmqpConnection.publish).toHaveBeenCalledTimes(3);
      
      // Check that each message has a unique correlation ID
      const calls = mockAmqpConnection.publish.mock.calls;
      const correlationIds = calls.map(call => call[3]?.headers?.['x-correlation-id']).filter(Boolean);
      const uniqueIds = new Set(correlationIds);
      
      expect(uniqueIds.size).toBe(3);
    });

    it('should reject batch with invalid messages', async () => {
      const invalidBatch = [
        mockValidPayload,
        mockInvalidPayload as XRayRawSignal,
        mockValidPayload,
      ];

      await expect(service.publishBatch(invalidBatch)).rejects.toThrow(
        'Batch validation failed: 1 invalid messages'
      );

      expect(mockAmqpConnection.publish).not.toHaveBeenCalled();
    });

    it('should handle batch publishing errors', async () => {
      mockAmqpConnection.publish.mockRejectedValue(new Error('Batch failed'));

      await expect(service.publishBatch(mockBatchPayloads)).rejects.toThrow('Batch failed');
    });

    it('should include batch metadata in headers', async () => {
      mockAmqpConnection.publish.mockResolvedValue(undefined as any);

      await service.publishBatch(mockBatchPayloads);

      const calls = mockAmqpConnection.publish.mock.calls;
      const firstCall = calls[0];
      
      if (firstCall?.[3]?.headers) {
        expect(firstCall[3].headers).toHaveProperty('x-batch-id');
        expect(firstCall[3].headers).toHaveProperty('x-batch-index');
        expect(firstCall[3].headers['x-batch-index']).toBe(0);
      }
    });
  });

  describe('publishDeviceStatus', () => {
    it('should publish device status successfully', async () => {
      mockAmqpConnection.publish.mockResolvedValue(undefined as any);

      const deviceId = 'test-device-001';
      const status = 'online';
      const health = { battery: 90, signalStrength: -60 };

      await service.publishDeviceStatus(deviceId, status, health);

      expect(mockAmqpConnection.publish).toHaveBeenCalledWith(
        'iot.xray',
        'device.status.v1',
        expect.objectContaining({
          deviceId,
          status,
          health,
          schemaVersion: 'v1',
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-correlation-id': expect.any(String),
            'x-timestamp': expect.any(String),
            'x-service': 'producer',
            'x-schema-version': 'v1',
          }),
        })
      );
    });

    it('should reject invalid device status', async () => {
      const invalidStatus = 'invalid-status' as any;

      await expect(service.publishDeviceStatus('device-1', invalidStatus)).rejects.toThrow(
        'Device status validation failed'
      );

      expect(mockAmqpConnection.publish).not.toHaveBeenCalled();
    });
  });

  describe('validation methods', () => {
    it('should validate raw signals correctly', () => {
      const validResult = service.validateRawSignal(mockValidPayload);
      expect(validResult.valid).toBe(true);

      const invalidResult = service.validateRawSignal(mockInvalidPayload);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toBeDefined();
    });

    it('should validate device status correctly', () => {
      const validStatus = {
        deviceId: 'device-1',
        status: 'online',
        lastSeen: new Date().toISOString(),
      };

      const validResult = service.validateDeviceStatus(validStatus);
      expect(validResult.valid).toBe(true);

      const invalidStatus = {
        deviceId: 'device-1',
        // Missing required fields
      };

      const invalidResult = service.validateDeviceStatus(invalidStatus);
      expect(invalidResult.valid).toBe(false);
    });

    it('should validate generic messages', () => {
      const result = service.validateMessage(mockValidPayload);
      expect(result.valid).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle unknown error types gracefully', async () => {
      const unknownError = 'String error';
      mockAmqpConnection.publish.mockRejectedValue(unknownError);

      await expect(service.publishMessage(mockValidPayload)).rejects.toThrow('String error');
    });

    it('should log validation errors with details', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      try {
        await service.publishMessage(mockInvalidPayload as XRayRawSignal);
      } catch (error) {
        // Expected to fail
      }

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
