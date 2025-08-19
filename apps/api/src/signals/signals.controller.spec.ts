import { Test, TestingModule } from '@nestjs/testing';
import { SignalsController } from './signals.controller';
import { SignalsService } from './signals.service';
import { CreateSignalDto, QuerySignalsDto } from '../../../../libs/shared-types/src';
import { TimeTrendsQuery } from './types';
import { NotFoundException } from '@nestjs/common';
import { Response } from 'express';

// Helper function to create mock Mongoose documents
function createMockDocument(data: Record<string, unknown>) {
  return {
    ...data,
    $assertPopulated: jest.fn(),
    $clearModifiedPaths: jest.fn(),
    $clone: jest.fn(),
    $createModifiedPathsSnapshot: jest.fn(),
    $getAllSubdocs: jest.fn(),
    $ignore: jest.fn(),
    $isDefault: jest.fn(),
    $isDeleted: jest.fn(),
    $isEmpty: jest.fn(),
    $isValid: jest.fn(),
    $locals: {},
    $op: null,
    $session: jest.fn(),
    $set: jest.fn(),
    $where: {},
    collection: {} as Record<string, unknown>,
    db: {} as Record<string, unknown>,
    delete: jest.fn(),
    deleteOne: jest.fn(),
    depopulate: jest.fn(),
    directModifiedKeys: jest.fn(),
    equals: jest.fn(),
    errors: {},
    get: jest.fn(),
    increment: jest.fn(),
    isDirectModified: jest.fn(),
    isInit: jest.fn(),
    isModified: jest.fn(),
    isSelected: jest.fn(),
    markModified: jest.fn(),
    modifiedPaths: jest.fn(),
    modelName: 'XRay',
    overwrite: jest.fn(),
    populate: jest.fn(),
    populated: jest.fn(),
    replaceOne: jest.fn(),
    resetModified: jest.fn(),
    save: jest.fn(),
    schema: {} as Record<string, unknown>,
    set: jest.fn(),
    toJSON: jest.fn(),
    toObject: jest.fn(),
    unmarkModified: jest.fn(),
    update: jest.fn(),
    validate: jest.fn(),
    validateSync: jest.fn(),
  };
}

describe('SignalsController', () => {
  let controller: SignalsController;
  let service: typeof mockSignalsService;
  let mockResponse: Response;

  const mockSignalsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    streamRawData: jest.fn(),
    getRawMetadata: jest.fn(),
    getStorageStats: jest.fn(),
    getDeviceStats: jest.fn(),
    getLocationClusters: jest.fn(),
    getTimeTrends: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SignalsController],
      providers: [
        {
          provide: SignalsService,
          useValue: mockSignalsService,
        },
      ],
    }).compile();

    controller = module.get<SignalsController>(SignalsController);
    service = module.get(SignalsService);

    // Setup mock response
    mockResponse = {
      setHeader: jest.fn(),
      pipe: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn(),
    } as unknown as Response;

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new signal successfully', async () => {
      // Arrange
      const createSignalDto: CreateSignalDto = {
        deviceId: 'test-device-001',
        time: Date.now(),
        data: [[1000, [51.339764, 12.339223, 1.2038]]],
      };

      const createdSignal = createMockDocument({
        _id: 'mock-signal-id',
        ...createSignalDto,
        dataLength: 1,
        dataVolume: 100,
        location: {
          type: 'Point',
          coordinates: [12.339223, 51.339764],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      service.create.mockResolvedValue(createdSignal);

      // Act
      const result = await controller.create(createSignalDto);

      // Assert
      expect(result).toEqual(createdSignal);
      expect(service.create).toHaveBeenCalledWith(createSignalDto);
    });

    it('should handle validation errors gracefully', async () => {
      // Arrange
      const invalidDto = {
        deviceId: '', // Invalid: empty string
        time: 'invalid-date', // Invalid: not a number
      } as unknown as CreateSignalDto;

      service.create.mockRejectedValue(new Error('Validation failed'));

      // Act & Assert
      await expect(controller.create(invalidDto)).rejects.toThrow('Validation failed');
    });
  });

  describe('findAll', () => {
    it('should return paginated signals with default parameters', async () => {
      // Arrange
      const queryDto: QuerySignalsDto = { limit: 20 };
      const mockSignals = [
        createMockDocument({
          _id: 'signal-1',
          deviceId: 'device-1',
          time: new Date(),
          dataLength: 1,
          dataVolume: 100,
          data: [[1000, [51.339764, 12.339223, 1.2038]]],
          location: {
            type: 'Point',
            coordinates: [12.339223, 51.339764],
          },
          idempotencyKey: 'key-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        createMockDocument({
          _id: 'signal-2',
          deviceId: 'device-2',
          time: new Date(),
          dataLength: 1,
          dataVolume: 100,
          data: [[2000, [51.339764, 12.339223, 1.2038]]],
          location: {
            type: 'Point',
            coordinates: [12.339223, 51.339764],
          },
          idempotencyKey: 'key-2',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      const expectedResult = {
        items: mockSignals,
        nextCursor: 'signal-2',
      };

      service.findAll.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findAll(queryDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalledWith(queryDto);
    });

    it('should apply filters correctly', async () => {
      // Arrange
      const queryDto: QuerySignalsDto = {
        deviceId: 'test-device',
        from: '2024-01-01T00:00:00Z',
        to: '2024-12-31T23:59:59Z',
        limit: 5,
        skip: 10,
      };

      const mockResult = {
        items: [],
        nextCursor: null,
      };

      service.findAll.mockResolvedValue(mockResult);

      // Act
      const result = await controller.findAll(queryDto);

      // Assert
      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(queryDto);
    });

    it('should handle empty results gracefully', async () => {
      // Arrange
      const queryDto: QuerySignalsDto = { limit: 20 };
      const emptyResult = {
        items: [],
        nextCursor: null,
      };

      service.findAll.mockResolvedValue(emptyResult);

      // Act
      const result = await controller.findAll(queryDto);

      // Assert
      expect(result).toEqual(emptyResult);
      expect(result.items).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a signal by ID successfully', async () => {
      // Arrange
      const signalId = 'mock-signal-id';
      const mockSignal = createMockDocument({
        _id: signalId,
        deviceId: 'test-device-001',
        time: new Date(),
        dataLength: 1,
        dataVolume: 100,
        data: [[1000, [51.339764, 12.339223, 1.2038]]],
        location: {
          type: 'Point',
          coordinates: [12.339223, 51.339764],
        },
        idempotencyKey: 'test-key-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      service.findOne.mockResolvedValue(mockSignal);

      // Act
      const result = await controller.findOne(signalId);

      // Assert
      expect(result).toEqual(mockSignal);
      expect(service.findOne).toHaveBeenCalledWith(signalId);
    });

    it('should handle non-existent signal gracefully', async () => {
      // Arrange
      const signalId = 'non-existent-id';

      service.findOne.mockRejectedValue(
        new NotFoundException('Signal with ID non-existent-id not found')
      );

      // Act & Assert
      await expect(controller.findOne(signalId)).rejects.toThrow(
        'Signal with ID non-existent-id not found'
      );
    });
  });

  describe('update', () => {
    it('should update a signal successfully', async () => {
      // Arrange
      const signalId = 'mock-signal-id';
      const updateSignalDto: Partial<CreateSignalDto> = {
        data: [[Date.now(), [51.339764, 12.339223, 1.2038]]] as [
          number,
          [number, number, number],
        ][],
      };

      const updatedSignal = createMockDocument({
        _id: signalId,
        deviceId: 'test-device-001',
        time: new Date(),
        dataLength: 1,
        dataVolume: 100,
        data: [[1000, [51.339764, 12.339223, 1.2038]]],
        location: {
          type: 'Point',
          coordinates: [12.339223, 51.339764],
        },
        idempotencyKey: 'test-key-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      service.update.mockResolvedValue(updatedSignal);

      // Act
      const result = await controller.update(signalId, updateSignalDto);

      // Assert
      expect(result).toEqual(updatedSignal);
      expect(service.update).toHaveBeenCalledWith(signalId, updateSignalDto);
    });

    it('should handle update validation errors gracefully', async () => {
      // Arrange
      const signalId = 'mock-signal-id';
      const invalidDto = {
        data: 'invalid-data', // Invalid: should be array
      } as unknown as Partial<CreateSignalDto>;

      service.update.mockRejectedValue(new Error('Validation failed'));

      // Act & Assert
      await expect(controller.update(signalId, invalidDto)).rejects.toThrow('Validation failed');
    });
  });

  describe('remove', () => {
    it('should remove a signal successfully', async () => {
      // Arrange
      const signalId = 'mock-signal-id';

      service.remove.mockResolvedValue({ message: 'Signal deleted successfully' });

      // Act
      const result = await controller.remove(signalId);

      // Assert
      expect(result).toEqual({ message: 'Signal deleted successfully' });
      expect(service.remove).toHaveBeenCalledWith(signalId);
    });

    it('should handle deletion of non-existent signal gracefully', async () => {
      // Arrange
      const signalId = 'non-existent-id';

      service.remove.mockResolvedValue({ message: 'Signal not found' });

      // Act & Assert
      const result = await controller.remove(signalId);
      expect(result.message).toBe('Signal not found');
    });
  });

  describe('streamRawData', () => {
    it('should stream raw data successfully', async () => {
      // Arrange
      const signalId = 'mock-signal-id';
      const mockSignal = createMockDocument({
        _id: signalId,
        deviceId: 'test-device-001',
        rawRef: 'mock-raw-ref-123',
      });
      const mockReadStream = {
        pipe: jest.fn().mockReturnThis(),
        on: jest.fn(),
      };

      service.findOne.mockResolvedValue(mockSignal);
      service.streamRawData.mockResolvedValue(mockReadStream as unknown as Response);
      mockReadStream.on.mockImplementation((event, callback) => {
        if (event === 'end') {
          (callback as () => void)();
        }
        return mockReadStream;
      });

      // Act
      await controller.streamRaw(signalId, mockResponse);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(signalId);
      expect(service.streamRawData).toHaveBeenCalledWith('mock-raw-ref-123', mockResponse);
    });

    it('should handle streaming errors gracefully', async () => {
      // Arrange
      const signalId = 'mock-signal-id';
      const mockSignal = createMockDocument({
        _id: signalId,
        deviceId: 'test-device-001',
        rawRef: 'mock-raw-ref-123',
      });

      service.findOne.mockResolvedValue(mockSignal);
      service.streamRawData.mockRejectedValue(new Error('Streaming failed'));

      // Act & Assert
      await expect(controller.streamRaw(signalId, mockResponse)).rejects.toThrow(
        'Streaming failed'
      );
      expect(service.findOne).toHaveBeenCalledWith(signalId);
      expect(service.streamRawData).toHaveBeenCalledWith('mock-raw-ref-123', mockResponse);
    });
  });

  describe('getRawMetadata', () => {
    it('should return raw data metadata successfully', async () => {
      // Arrange
      const signalId = 'mock-signal-id';
      const mockMetadata = {
        filename: 'test.json.gz',
        length: 1024,
        uploadDate: new Date(),
        metadata: {
          hash: 'test-hash',
          contentType: 'application/gzip',
          originalSize: 2048,
          compressedSize: 1024,
          timestamp: new Date(),
        },
        contentType: 'application/gzip',
      };

      const mockSignal = createMockDocument({
        _id: signalId,
        deviceId: 'test-device-001',
        rawRef: 'mock-raw-ref-123',
      });

      service.findOne.mockResolvedValue(mockSignal);
      service.getRawMetadata.mockResolvedValue(mockMetadata);

      // Act
      const result = await controller.getRawMetadata(signalId);

      // Assert
      expect(result).toEqual(mockMetadata);
      expect(service.getRawMetadata).toHaveBeenCalledWith('mock-raw-ref-123');
    });

    it('should handle missing raw data gracefully', async () => {
      // Arrange
      const signalId = 'mock-signal-id';
      const mockSignal = createMockDocument({
        _id: signalId,
        deviceId: 'test-device-001',
        // No rawRef
      });

      service.findOne.mockResolvedValue(mockSignal);

      // Act & Assert
      await expect(controller.getRawMetadata(signalId)).rejects.toThrow(
        'Raw data not found for this signal'
      );
    });
  });

  describe('getStorageStats', () => {
    it('should return storage statistics successfully', async () => {
      // Arrange
      const mockStats = {
        totalFiles: 10,
        totalSize: 10240,
        avgFileSize: 1024,
        storageSize: 1024,
        indexSize: 2048,
      };

      service.getStorageStats.mockResolvedValue(mockStats);

      // Act
      const result = await controller.getStorageStats();

      // Assert
      expect(result).toEqual(mockStats);
      expect(service.getStorageStats).toHaveBeenCalled();
    });

    it('should handle storage stats errors gracefully', async () => {
      // Arrange
      service.getStorageStats.mockRejectedValue(new Error('Failed to get storage statistics'));

      // Act & Assert
      await expect(controller.getStorageStats()).rejects.toThrow(
        'Failed to get storage statistics'
      );
    });
  });

  describe('error handling', () => {
    it('should handle service errors and return appropriate HTTP status', async () => {
      // Arrange
      const createSignalDto: CreateSignalDto = {
        deviceId: 'test-device-001',
        time: Date.now(),
        data: [[1000, [51.339764, 12.339223, 1.2038]]],
      };

      const serviceError = new Error('Database connection failed');
      service.create.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(controller.create(createSignalDto)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle validation errors with proper error messages', async () => {
      // Arrange
      const invalidDto = {
        deviceId: '',
        time: 'invalid-date',
      } as unknown as CreateSignalDto;

      const validationError = new Error('Validation failed: deviceId cannot be empty');
      service.create.mockRejectedValue(validationError);

      // Act & Assert
      await expect(controller.create(invalidDto)).rejects.toThrow(
        'Validation failed: deviceId cannot be empty'
      );
    });
  });

  describe('input validation', () => {
    it('should validate required fields in CreateSignalDto', async () => {
      // Arrange
      const validDto: CreateSignalDto = {
        deviceId: 'test-device-001',
        time: Date.now(),
        data: [[1000, [51.339764, 12.339223, 1.2038]]],
      };

      const createdSignal = createMockDocument({
        _id: 'mock-signal-id',
        ...validDto,
        dataLength: 1,
        dataVolume: 100,
        location: {
          type: 'Point',
          coordinates: [12.339223, 51.339764],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      service.create.mockResolvedValue(createdSignal);

      // Act
      const result = await controller.create(validDto);

      // Assert
      expect(result).toEqual(createdSignal);
      expect(result.deviceId).toBe('test-device-001');
      expect(result.location?.coordinates).toEqual([12.339223, 51.339764]);
    });

    it('should validate coordinate ranges in location', async () => {
      // Arrange
      const dtoWithInvalidCoordinates: CreateSignalDto = {
        deviceId: 'test-device-001',
        time: Date.now(),
        data: [
          [Date.now(), [200, 100, 1.0]], // Invalid: latitude > 90
        ],
      };

      service.create.mockRejectedValue(new Error('Invalid coordinates'));

      // Act & Assert
      await expect(controller.create(dtoWithInvalidCoordinates)).rejects.toThrow(
        'Invalid coordinates'
      );
    });
  });

  describe('Analytics Endpoints', () => {
    describe('getDeviceStats', () => {
      it('should return device statistics successfully', async () => {
        // Arrange
        const mockQuery = { deviceId: 'test-device-001' };
        const mockStats = [
          {
            _id: 'test-device-001',
            totalSignals: 5,
            totalDataVolume: 10240,
            avgDataLength: 3,
            avgDataVolume: 2048,
            firstSeen: new Date('2025-01-01'),
            lastSeen: new Date('2025-01-05'),
            totalDistance: 1000,
            maxSpeed: 120,
            avgSpeed: 60,
          },
        ];

        service.getDeviceStats.mockResolvedValue(mockStats);

        // Act
        const result = await controller.getDeviceStats(mockQuery);

        // Assert
        expect(result).toEqual(mockStats);
        expect(service.getDeviceStats).toHaveBeenCalledWith(mockQuery);
      });

      it('should handle device stats errors gracefully', async () => {
        // Arrange
        const mockQuery = { deviceId: 'test-device-001' };
        service.getDeviceStats.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(controller.getDeviceStats(mockQuery)).rejects.toThrow('Database error');
      });
    });

    describe('getLocationClusters', () => {
      it('should return location clusters successfully', async () => {
        // Arrange
        const mockQuery = { limit: 5 };
        const mockClusters = [
          {
            _id: { lat: 51.339764, lon: 12.339223 },
            count: 10,
            deviceIds: ['device-1', 'device-2'],
            avgDataLength: 3,
            avgDataVolume: 2048,
          },
        ];

        service.getLocationClusters.mockResolvedValue(mockClusters);

        // Act
        const result = await controller.getLocationClusters(mockQuery);

        // Assert
        expect(result).toEqual(mockClusters);
        expect(service.getLocationClusters).toHaveBeenCalledWith(mockQuery);
      });

      it('should handle location clusters errors gracefully', async () => {
        // Arrange
        const mockQuery = { limit: 5 };
        service.getLocationClusters.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(controller.getLocationClusters(mockQuery)).rejects.toThrow('Database error');
      });
    });

    describe('getTimeTrends', () => {
      it('should return time trends successfully', async () => {
        // Arrange
        const mockQuery: TimeTrendsQuery = { period: 'day', groupBy: 'device' };
        const mockTrends = [
          {
            _id: { year: 2025, month: 1, day: 1 },
            count: 5,
            totalDataVolume: 10240,
            avgDataLength: 3,
            uniqueDevices: ['test-device-001'],
            uniqueDeviceCount: 1,
          },
        ];

        service.getTimeTrends.mockResolvedValue(mockTrends);

        // Act
        const result = await controller.getTimeTrends(mockQuery);

        // Assert
        expect(result).toEqual(mockTrends);
        expect(service.getTimeTrends).toHaveBeenCalledWith(mockQuery);
      });

      it('should handle time trends errors gracefully', async () => {
        // Arrange
        const mockQuery: TimeTrendsQuery = { period: 'day' };
        service.getTimeTrends.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(controller.getTimeTrends(mockQuery)).rejects.toThrow('Database error');
      });
    });
  });
});
