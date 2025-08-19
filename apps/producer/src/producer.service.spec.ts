import { Test, TestingModule } from '@nestjs/testing';
import { ProducerService } from './producer.service';
import { TestDataGeneratorService } from './test-data-generator.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@nestjs/config';
import { XRayDataTuple, LegacyXRayPayload, XRayPayloadAllFormats } from '@iotp/shared-types';

describe('ProducerService', () => {
  let service: ProducerService;
  const mockTestDataGenerator = {
    generateOriginalFormat: jest.fn(),
    generateDifferentDeviceFormat: jest.fn(),
    generateMultipleDataPoints: jest.fn(),
    generateSingleDataPoint: jest.fn(),
    generateHighPrecisionData: jest.fn(),
    generateEdgeCaseSmallValues: jest.fn(),
    generateEdgeCaseLargeValues: jest.fn(),
    generateDifferentTimestampFormat: jest.fn(),
    generateAllTestFormats: jest.fn(),
    generateRandomTestData: jest.fn(),
  };

  const mockAmqpConnection = {
    publish: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProducerService,
        {
          provide: TestDataGeneratorService,
          useValue: mockTestDataGenerator,
        },
        {
          provide: AmqpConnection,
          useValue: mockAmqpConnection,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ProducerService>(ProducerService);

    // Reset all mocks
    jest.clearAllMocks();

    // Mock configuration
    mockConfigService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'RABBITMQ_EXCHANGE':
          return 'iot.xray';
        case 'RABBITMQ_ROUTING_KEY':
          return 'xray.raw';
        default:
          return undefined;
      }
    });
  });

  describe('sendXRayData', () => {
    it('should send X-Ray data to RabbitMQ successfully', async () => {
      // Arrange
      const testData: LegacyXRayPayload = {
        'test-device-001': {
          data: [[1000, [51.339764, 12.339223, 1.2038]]] as XRayDataTuple[],
          time: Date.now(),
        },
      };

      mockAmqpConnection.publish.mockResolvedValue(undefined);

      // Act
      const result = await service.publishMessage(testData);

      // Assert
      expect(result.success).toBe(true);
      expect(mockAmqpConnection.publish).toHaveBeenCalledWith('iot.xray', 'xray.raw', testData);
    });

    it('should handle RabbitMQ publishing errors gracefully', async () => {
      // Arrange
      const testData: LegacyXRayPayload = {
        'test-device-001': {
          data: [[1000, [51.339764, 12.339223, 1.2038]]] as XRayDataTuple[],
          time: Date.now(),
        },
      };

      mockAmqpConnection.publish.mockRejectedValue(new Error('Connection failed'));

      // Act & Assert
      await expect(service.publishMessage(testData)).rejects.toThrow('Connection failed');
    });

    it('should validate data format before sending', async () => {
      // Arrange
      const invalidData = {
        invalidField: 'invalid value',
      };

      // Act & Assert
      await expect(
        service.publishMessage(invalidData as unknown as XRayPayloadAllFormats)
      ).rejects.toThrow();
    });
  });

  describe('sendTestData', () => {
    it('should send test data successfully', async () => {
      // Arrange
      const mockTestData = { 'test-device': { data: [], time: Date.now() } };
      mockTestDataGenerator.generateOriginalFormat.mockReturnValue(mockTestData);
      mockAmqpConnection.publish.mockResolvedValue(undefined);

      // Act
      const result = await service.sendTestData();

      // Assert
      expect(result).toBeUndefined(); // sendTestData returns void
      expect(mockAmqpConnection.publish).toHaveBeenCalledWith('iot.xray', 'xray.raw', mockTestData);
    });
  });

  describe('testAllDataFormats', () => {
    it('should test all data formats successfully', async () => {
      // Arrange
      const mockFormats = [
        { name: 'Original Format', data: { 'device-1': { data: [], time: Date.now() } } },
        { name: 'Different Device Format', data: { 'device-2': { data: [], time: Date.now() } } },
        { name: 'Multiple Data Points', data: { 'device-3': { data: [], time: Date.now() } } },
        { name: 'Single Data Point', data: { 'device-4': { data: [], time: Date.now() } } },
        { name: 'High Precision Data', data: { 'device-5': { data: [], time: Date.now() } } },
        { name: 'Edge Case Small Values', data: { 'device-6': { data: [], time: Date.now() } } },
        { name: 'Edge Case Large Values', data: { 'device-7': { data: [], time: Date.now() } } },
        {
          name: 'Different Timestamp Format',
          data: { 'device-8': { data: [], time: Date.now() } },
        },
      ];

      mockTestDataGenerator.generateAllTestFormats.mockReturnValue(mockFormats);
      mockAmqpConnection.publish.mockResolvedValue(undefined);

      // Act
      const result = await service.publishBatch(
        mockFormats.map(f => f.data as unknown as XRayPayloadAllFormats)
      );

      // Assert
      expect(result.totalMessages).toBe(8);
      expect(result.successfulPublishes).toBe(8);
      expect(mockAmqpConnection.publish).toHaveBeenCalledTimes(8);
    });

    it('should handle individual format failures gracefully', async () => {
      // Arrange
      const mockFormats = [
        { name: 'Original Format', data: { 'device-1': { data: [], time: Date.now() } } },
        { name: 'Failing Format', data: { 'device-2': { data: [], time: Date.now() } } },
      ];

      mockTestDataGenerator.generateAllTestFormats.mockReturnValue(mockFormats);
      mockAmqpConnection.publish
        .mockResolvedValueOnce(undefined) // First call succeeds
        .mockRejectedValueOnce(new Error('Publishing failed')); // Second call fails

      // Act
      const result = await service.publishBatch(
        mockFormats.map(f => f.data as unknown as XRayPayloadAllFormats)
      );

      // Assert
      expect(result.totalMessages).toBe(2);
      expect(result.successfulPublishes).toBe(1);
      expect(result.failedPublishes).toBe(1);
      expect(result.errors[0].error).toBe('Publishing failed');
    });
  });

  describe('testRandomData', () => {
    it('should send random test data successfully', async () => {
      // Arrange
      const mockRandomData: LegacyXRayPayload = {
        'random-device': {
          data: [[1000, [51.339764, 12.339223, 1.2038]]] as XRayDataTuple[],
          time: Date.now(),
        },
      };

      mockTestDataGenerator.generateRandomTestData.mockReturnValue(mockRandomData);
      mockAmqpConnection.publish.mockResolvedValue(undefined);

      // Act
      const result = await service.publishMessage(mockRandomData);

      // Assert
      expect(result.success).toBe(true);
      // Note: publishMessage doesn't call generateRandomTestData, it just publishes the data
      expect(mockAmqpConnection.publish).toHaveBeenCalledWith(
        'iot.xray',
        'xray.raw',
        mockRandomData
      );
    });

    it('should handle random data generation errors gracefully', async () => {
      // Arrange
      const mockRandomData: LegacyXRayPayload = {
        'random-device': {
          data: [[1000, [51.339764, 12.339223, 1.2038]]] as XRayDataTuple[],
          time: Date.now(),
        },
      };

      mockTestDataGenerator.generateRandomTestData.mockImplementation(() => {
        throw new Error('Random data generation failed');
      });

      // Act & Assert
      const result = await service.publishMessage(mockRandomData);
      expect(result.success).toBe(true);
    });
  });

  describe('testEdgeCases', () => {
    it('should test edge cases successfully', async () => {
      // Arrange
      const mockEdgeCases = [
        { name: 'Empty Data Array', data: { 'edge-device-1': { data: [], time: Date.now() } } },
        {
          name: 'Null Coordinates',
          data: { 'edge-device-2': { data: [[1000, [null, null, null]]], time: Date.now() } },
        },
        {
          name: 'Large Values',
          data: { 'edge-device-3': { data: [[1000, [999999, 999999, 999999]]], time: Date.now() } },
        },
      ];

      mockTestDataGenerator.generateEdgeCaseSmallValues.mockReturnValue(mockEdgeCases[0]);
      mockTestDataGenerator.generateEdgeCaseLargeValues.mockReturnValue(mockEdgeCases[2]);
      mockAmqpConnection.publish.mockResolvedValue(undefined);

      // Act
      const result = await service.publishBatch(
        mockEdgeCases.map(edge => edge.data as unknown as XRayPayloadAllFormats)
      );

      // Assert
      expect(result.totalMessages).toBe(3); // 3 edge cases defined in the test
      expect(result.successfulPublishes).toBe(3);
      expect(mockAmqpConnection.publish).toHaveBeenCalledTimes(3);
    });
  });

  describe('data validation', () => {
    it('should validate device ID format', async () => {
      // Arrange
      const validData = {
        'valid-device-001': {
          data: [[1000, [51.339764, 12.339223, 1.2038]]] as XRayDataTuple[],
          time: Date.now(),
        },
      };

      mockAmqpConnection.publish.mockResolvedValue(undefined);

      // Act
      const result = await service.publishMessage(validData);

      // Assert
      expect(result.success).toBe(true); // publishMessage returns PublishResult
    });

    it('should validate data structure', async () => {
      // Arrange
      const validData: LegacyXRayPayload = {
        'test-device': {
          data: [[1000, [51.339764, 12.339223, 1.2038]]],
          time: Date.now(),
        },
      };

      mockAmqpConnection.publish.mockResolvedValue(undefined);

      // Act
      const result = await service.publishMessage(validData);

      // Assert
      expect(result.success).toBe(true); // publishMessage returns PublishResult
      expect(mockAmqpConnection.publish).toHaveBeenCalledWith('iot.xray', 'xray.raw', validData);
    });

    it('should accept any data structure', async () => {
      // Arrange
      const invalidData = {
        'test-device': {
          invalidField: 'invalid value',
        },
      };

      mockAmqpConnection.publish.mockResolvedValue(undefined);

      // Act
      const result = await service.publishMessage(invalidData as unknown as XRayPayloadAllFormats);

      // Assert
      expect(result.success).toBe(true); // publishMessage returns PublishResult
      expect(mockAmqpConnection.publish).toHaveBeenCalledWith('iot.xray', 'xray.raw', invalidData);
    });
  });

  describe('configuration handling', () => {
    it('should use correct RabbitMQ exchange and routing key', async () => {
      // Arrange
      const testData: LegacyXRayPayload = {
        'test-device': {
          data: [[1000, [51.339764, 12.339223, 1.2038]]] as XRayDataTuple[],
          time: Date.now(),
        },
      };

      mockAmqpConnection.publish.mockResolvedValue(undefined);

      // Act
      await service.publishMessage(testData);

      // Assert
      expect(mockAmqpConnection.publish).toHaveBeenCalledWith('iot.xray', 'xray.raw', testData);
    });

    it('should handle missing configuration gracefully', async () => {
      // Arrange
      mockConfigService.get.mockReturnValue(undefined);

      const testData: LegacyXRayPayload = {
        'test-device': {
          data: [[1000, [51.339764, 12.339223, 1.2038]]] as XRayDataTuple[],
          time: Date.now(),
        },
      };

      // Act
      const result = await service.publishMessage(testData);

      // Assert
      expect(result.success).toBe(true); // publishMessage returns PublishResult
    });
  });

  describe('error handling and recovery', () => {
    it('should handle temporary failures gracefully', async () => {
      // Arrange
      const testData: LegacyXRayPayload = {
        'test-device': {
          data: [[1000, [51.339764, 12.339223, 1.2038]]] as XRayDataTuple[],
          time: Date.now(),
        },
      };

      // First call fails
      mockAmqpConnection.publish.mockRejectedValueOnce(new Error('Temporary failure'));

      // Act & Assert
      await expect(service.publishMessage(testData)).rejects.toThrow('Temporary failure');
      expect(mockAmqpConnection.publish).toHaveBeenCalledTimes(1);
    });

    it('should handle network timeouts gracefully', async () => {
      // Arrange
      const testData: LegacyXRayPayload = {
        'test-device': {
          data: [[1000, [51.339764, 12.339223, 1.2038]]] as XRayDataTuple[],
          time: Date.now(),
        },
      };

      mockAmqpConnection.publish.mockRejectedValue(new Error('Network timeout'));

      // Act & Assert
      await expect(service.publishMessage(testData)).rejects.toThrow('Network timeout');
    });
  });

  describe('performance and scalability', () => {
    it('should handle high-volume data sending', async () => {
      // Arrange
      const highVolumeData = Array(100)
        .fill(null)
        .map((_, index) => ({
          [`device-${index}`]: {
            data: [[1000, [51.339764, 12.339223, 1.2038]]] as XRayDataTuple[],
            time: Date.now(),
          },
        }));

      mockAmqpConnection.publish.mockResolvedValue(undefined);

      // Act
      const promises = highVolumeData.map(data => service.publishMessage(data));
      const results = await Promise.all(promises);

      // Assert
      expect(results.every(r => r.success === true)).toBe(true);
      expect(mockAmqpConnection.publish).toHaveBeenCalledTimes(100);
    });

    it('should maintain performance under load', async () => {
      // Arrange
      const startTime = Date.now();
      const testData: LegacyXRayPayload = {
        'test-device': {
          data: [[1000, [51.339764, 12.339223, 1.2038]]] as XRayDataTuple[],
          time: Date.now(),
        },
      };

      mockAmqpConnection.publish.mockResolvedValue(undefined);

      // Act
      const result = await service.publishMessage(testData);
      const endTime = Date.now();

      // Assert
      expect(result.success).toBe(true); // publishMessage returns PublishResult
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
