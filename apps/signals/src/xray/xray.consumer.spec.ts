import { Test, TestingModule } from '@nestjs/testing';
import { XRayConsumer } from './xray.consumer';
import { getModelToken } from '@nestjs/mongoose';
import { ErrorHandlingService } from '../error-handling/error-handling.service';
import { LegacyPayload } from '@iotp/shared-messaging';
import {
  validateMessage,
  generateIdempotencyKey,
  normalizeXRayPayload,
} from '@iotp/shared-messaging';
import { ConfigService } from '@iotp/shared-config';

// Mock the shared messaging module
jest.mock('@iotp/shared-messaging', () => ({
  validateMessage: jest.fn(),
  generateIdempotencyKey: jest.fn(),
  normalizeXRayPayload: jest.fn(),
}));

// Mock AMQP message object
const createMockAmqpMsg = (messageId?: string, correlationId?: string) => ({
  properties: {
    messageId: messageId || 'test-message-id',
    headers: {
      'x-correlation-id': correlationId || 'test-correlation-id',
    },
  },
});

describe('XRayConsumer', () => {
  let consumer: XRayConsumer;

  // Create a properly typed mock Mongoose model
  const MockXRayModel = Object.assign(
    jest.fn().mockImplementation((doc: Record<string, unknown>) => {
      return {
        ...doc,
        save: jest.fn().mockResolvedValue({ _id: 'mock-signal-id' }),
      };
    }),
    {
      findOne: jest.fn(),
      create: jest.fn(),
    }
  );

  const mockRawStore = {
    store: jest.fn(),
    getPresignedUrl: jest.fn(),
    getMetadata: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
    getFileSize: jest.fn(),
    getStorageStats: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockErrorHandlingService = {
    withRetry: jest.fn(),
    withCircuitBreaker: jest.fn(),
    getCircuitBreakerStatus: jest.fn(),
    resetCircuitBreaker: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        XRayConsumer,
        {
          provide: getModelToken('XRay'),
          useValue: MockXRayModel,
        },
        {
          provide: 'IRawStore',
          useValue: mockRawStore,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: ErrorHandlingService,
          useValue: mockErrorHandlingService,
        },
      ],
    }).compile();

    consumer = module.get<XRayConsumer>(XRayConsumer);

    // Dependencies are already injected via the module
    jest.clearAllMocks();
    mockConfigService.get.mockReturnValue(3); // RABBITMQ_RETRY_MAX

    // Setup default mock implementations
    (validateMessage as jest.Mock).mockReturnValue({ valid: true, errors: [] });
    (generateIdempotencyKey as jest.Mock).mockReturnValue('mock-idempotency-key');
    (normalizeXRayPayload as jest.Mock).mockReturnValue({
      deviceId: 'test-device-001',
      data: [[1000, [51.339764, 12.339223, 1.2038]]],
      time: Date.now(),
    });
  });

  describe('processMessage', () => {
    it('should process valid X-Ray message successfully', async () => {
      // Arrange
      const message: LegacyPayload = {
        'test-device-001': {
          data: [{ timestamp: 1000, lat: 51.339764, lon: 12.339223, speed: 1.2038 }],
          time: Date.now(),
        },
      };

      // Mock the error handling service to execute the operation
      mockErrorHandlingService.withRetry.mockImplementation(
        async (operation: () => Promise<boolean>) => {
          return await operation();
        }
      );

      // Mock dependencies
      MockXRayModel.findOne.mockResolvedValue(null);
      mockRawStore.store.mockResolvedValue('mock-raw-ref');

      // Act
      await consumer.processMessage(message, createMockAmqpMsg());

      // Assert
      expect(mockErrorHandlingService.withRetry).toHaveBeenCalled();
      // store is called with normalized payload
      expect(mockRawStore.store).toHaveBeenCalled();
      expect(MockXRayModel).toHaveBeenCalled();
    });

    it('should handle duplicate messages with idempotency', async () => {
      // Arrange
      const message: LegacyPayload = {
        'test-device-001': {
          data: [{ timestamp: 1000, lat: 51.339764, lon: 12.339223, speed: 1.2038 }],
          time: Date.now(),
        },
      };

      // Mock the error handling service to return the actual operation result
      mockErrorHandlingService.withRetry.mockImplementation(
        async (operation: () => Promise<boolean>) => {
          return await operation();
        }
      );

      // Mock existing signal found (duplicate)
      MockXRayModel.findOne.mockResolvedValue({ _id: 'existing-signal' });

      // Act
      await consumer.processMessage(message, createMockAmqpMsg());

      // Assert
      expect(mockErrorHandlingService.withRetry).toHaveBeenCalled();
      expect(MockXRayModel.findOne).toHaveBeenCalledWith({
        idempotencyKey: 'mock-idempotency-key',
      });
      // Should not create new signal or store raw data
      expect(mockRawStore.store).not.toHaveBeenCalled();
      expect(MockXRayModel).not.toHaveBeenCalled();
    });

    it('should handle processing errors gracefully', async () => {
      // Arrange
      const message: LegacyPayload = {
        'test-device-001': {
          data: [{ timestamp: 1000, lat: 51.339764, lon: 12.339223, speed: 1.2038 }],
          time: Date.now(),
        },
      };

      // Mock the error handling service to throw an error
      mockErrorHandlingService.withRetry.mockRejectedValue(new Error('Processing failed'));

      // Act & Assert - should not throw since we catch errors in processMessage
      await expect(consumer.processMessage(message, createMockAmqpMsg())).resolves.toBeUndefined();
      expect(mockErrorHandlingService.withRetry).toHaveBeenCalled();
    });

    it('should handle retry logic for failed messages', async () => {
      // Arrange
      const message: LegacyPayload = {
        'test-device-001': {
          data: [{ timestamp: 1000, lat: 51.339764, lon: 12.339764, speed: 1.2038 }],
          time: Date.now(),
        },
      };

      // Mock the error handling service to simulate retry behavior
      mockErrorHandlingService.withRetry.mockImplementation(
        async (operation: () => Promise<boolean>) => {
          // Simulate retry logic
          return await operation();
        }
      );

      // Mock dependencies
      MockXRayModel.findOne.mockResolvedValue(null);
      mockRawStore.store.mockResolvedValue('mock-raw-ref');

      // Act
      await consumer.processMessage(message, createMockAmqpMsg());

      // Assert
      expect(mockErrorHandlingService.withRetry).toHaveBeenCalled();
    });
  });

  describe('message processing flow', () => {
    it('should extract location from data points correctly', async () => {
      // Arrange
      const message: LegacyPayload = {
        'test-device-001': {
          data: [{ timestamp: 1000, lat: 51.339764, lon: 12.339223, speed: 1.2038 }],
          time: Date.now(),
        },
      };

      // Mock the error handling service
      mockErrorHandlingService.withRetry.mockImplementation(
        async (operation: () => Promise<boolean>) => {
          return await operation();
        }
      );

      // Override the normalizeXRayPayload mock for this test
      (normalizeXRayPayload as jest.Mock).mockReturnValue({
        deviceId: 'test-device-001',
        data: [{ timestamp: 1000, lat: 51.339764, lon: 12.339223, speed: 1.2038 }], // Object format
        time: Date.now(),
      });

      // Mock dependencies
      MockXRayModel.findOne.mockResolvedValue(null);
      mockRawStore.store.mockResolvedValue('mock-raw-ref');

      // Act
      await consumer.processMessage(message, createMockAmqpMsg());

      // Assert
      expect(mockErrorHandlingService.withRetry).toHaveBeenCalled();
      // Verify that location was extracted and used in signal creation
      expect(MockXRayModel).toHaveBeenCalledWith(
        expect.objectContaining({
          location: {
            type: 'Point',
            coordinates: [12.339223, 51.339764], // [lon, lat]
          },
        })
      );
    });

    it('should handle messages without data points', async () => {
      // Arrange
      const message = {
        'test-device-001': {
          data: [],
          time: Date.now(),
        },
      };

      // Mock the error handling service
      mockErrorHandlingService.withRetry.mockImplementation(
        async (operation: () => Promise<boolean>) => {
          return await operation();
        }
      );

      // Override the normalizeXRayPayload mock for this test
      (normalizeXRayPayload as jest.Mock).mockReturnValue({
        deviceId: 'test-device-001',
        data: [],
        time: Date.now(),
      });

      // Mock dependencies
      MockXRayModel.findOne.mockResolvedValue(null);
      mockRawStore.store.mockResolvedValue('mock-raw-ref');

      // Act
      await consumer.processMessage(message, createMockAmqpMsg());

      // Assert
      expect(mockErrorHandlingService.withRetry).toHaveBeenCalled();
      // Verify that signal is created without location when no data points
      expect(MockXRayModel).toHaveBeenCalledWith(
        expect.objectContaining({
          location: undefined,
        })
      );
    });
  });
});
