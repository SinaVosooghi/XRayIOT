import { Test, TestingModule } from '@nestjs/testing';
import { SignalsController } from './signals.controller';
import { SignalsService } from './signals.service';
import { CreateSignalDto, UpdateSignalDto, DataPointDto } from './dto';
import { BaseQuerySignalsDto } from '@iotp/shared-types';
import { NotFoundException } from '@nestjs/common';

describe('SignalsController', () => {
  let controller: SignalsController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    getDeviceStats: jest.Mock;
    getLocationClusters: jest.Mock;
    getTimeTrends: jest.Mock;
    streamRawData: jest.Mock;
    getRawMetadata: jest.Mock;
    getStorageStats: jest.Mock;
  };

  const createMockDocument = <T>(data: T) => ({
    ...data,
    toObject: () => data,
    toJSON: () => data,
  });

  // Helper function to create type-safe Jest matchers
  const anyNumber = () => expect.any(Number) as unknown as number;
  const arrayContaining = <T>(items: T[]) => expect.arrayContaining(items) as unknown as T[];

  beforeEach(async () => {
    // Create mock service with all required methods
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      getDeviceStats: jest.fn(),
      getLocationClusters: jest.fn(),
      getTimeTrends: jest.fn(),
      streamRawData: jest.fn(),
      getRawMetadata: jest.fn(),
      getStorageStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SignalsController],
      providers: [
        {
          provide: SignalsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<SignalsController>(SignalsController);
    service = module.get(SignalsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated signals with default parameters', async () => {
      // Arrange
      const queryDto: BaseQuerySignalsDto = { limit: 20 };
      const mockSignals = [
        createMockDocument({
          _id: 'mock-signal-1',
          deviceId: 'test-device-1',
          time: new Date(),
          dataLength: 1,
          dataVolume: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        createMockDocument({
          _id: 'mock-signal-2',
          deviceId: 'test-device-2',
          time: new Date(),
          dataLength: 1,
          dataVolume: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      const mockPaginatedResult = {
        items: mockSignals,
        total: 2,
        page: 1,
        limit: 20,
        hasNext: false,
        hasPrev: false,
      };

      service.findAll.mockResolvedValue(mockPaginatedResult);

      // Act
      const result = await controller.findAll(queryDto);

      // Assert
      expect(result).toBe(mockPaginatedResult);
      expect(service.findAll).toHaveBeenCalledWith(queryDto);
    });

    it('should apply filters correctly', async () => {
      // Arrange
      const queryDto: BaseQuerySignalsDto = {
        deviceId: 'test-device',
        from: '2024-01-01T00:00:00Z',
        to: '2024-01-02T00:00:00Z',
        limit: 10,
        skip: 0,
      };

      const mockSignals = [
        createMockDocument({
          _id: 'mock-signal-1',
          deviceId: 'test-device',
          time: new Date('2024-01-01T12:00:00Z'),
          dataLength: 1,
          dataVolume: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      const mockPaginatedResult = {
        items: mockSignals,
        total: 1,
        page: 1,
        limit: 10,
        hasNext: false,
        hasPrev: false,
      };

      service.findAll.mockResolvedValue(mockPaginatedResult);

      // Act
      const result = await controller.findAll(queryDto);

      // Assert
      expect(result).toBe(mockPaginatedResult);
      expect(service.findAll).toHaveBeenCalledWith(queryDto);
    });

    it('should handle empty results gracefully', async () => {
      // Arrange
      const queryDto: BaseQuerySignalsDto = { limit: 20 };
      const emptyResult = {
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        hasNext: false,
        hasPrev: false,
      };

      service.findAll.mockResolvedValue(emptyResult);

      // Act
      const result = await controller.findAll(queryDto);

      // Assert
      expect(result).toBe(emptyResult);
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a signal by ID', async () => {
      // Arrange
      const signalId = 'mock-signal-id';
      const mockSignal = createMockDocument({
        _id: signalId,
        deviceId: 'test-device',
        time: new Date(),
        dataLength: 1,
        dataVolume: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      service.findOne.mockResolvedValue(mockSignal);

      // Act
      const result = await controller.findOne(signalId);

      // Assert
      expect(result).toBe(mockSignal);
      expect(service.findOne).toHaveBeenCalledWith(signalId);
    });

    it('should handle signal not found', async () => {
      // Arrange
      const signalId = 'non-existent-id';
      service.findOne.mockRejectedValue(
        new NotFoundException(`Signal with ID ${signalId} not found`)
      );

      // Act & Assert
      await expect(controller.findOne(signalId)).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith(signalId);
    });
  });

  describe('create', () => {
    it('should create a signal successfully', async () => {
      // Arrange
      const createSignalDto = new CreateSignalDto();
      createSignalDto.deviceId = 'test-device';
      createSignalDto.time = Date.now();
      const dataPoint = new DataPointDto();
      dataPoint.timestamp = 1000;
      dataPoint.lat = 51.339764;
      dataPoint.lon = 12.339223;
      dataPoint.speed = 1.2038;
      createSignalDto.data = [dataPoint];

      const mockSignal = createMockDocument({
        _id: 'mock-signal-id',
        deviceId: 'test-device',
        time: new Date(),
        dataLength: 1,
        dataVolume: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      service.create.mockResolvedValue(mockSignal);

      // Act
      const result = await controller.create(createSignalDto);

      // Assert
      expect(result).toBe(mockSignal);
      expect(service.create).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceId: 'test-device',
          time: anyNumber(),
          data: arrayContaining([{ timestamp: 1000, lat: 51.339764, lon: 12.339223, speed: 1.2038 }]), // DataPoint format
        })
      );
    });
  });

  describe('update', () => {
    it('should update a signal successfully', async () => {
      // Arrange
      const signalId = 'mock-signal-id';
      const updateDataPoint = new DataPointDto();
      updateDataPoint.timestamp = Date.now();
      updateDataPoint.lat = 51.339764;
      updateDataPoint.lon = 12.339223;
      updateDataPoint.speed = 1.2038;

      const updateSignalDto: UpdateSignalDto = {
        data: [updateDataPoint],
      };

      const mockSignal = createMockDocument({
        _id: signalId,
        deviceId: 'test-device',
        time: new Date(),
        dataLength: 1,
        dataVolume: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      service.update.mockResolvedValue(mockSignal);

      // Act
      const result = await controller.update(signalId, updateSignalDto);

      // Assert
      expect(result).toBe(mockSignal);
      expect(service.update).toHaveBeenCalledWith(
        signalId,
        expect.objectContaining({
          data: arrayContaining([{ timestamp: anyNumber(), lat: 51.339764, lon: 12.339223, speed: 1.2038 }]), // DataPoint format
        })
      );
    });

    it('should handle validation errors during update', async () => {
      // Arrange
      const signalId = 'mock-signal-id';
      const invalidDataPoint = new DataPointDto();
      invalidDataPoint.timestamp = Date.now();
      invalidDataPoint.lat = 200; // Invalid: latitude > 90
      invalidDataPoint.lon = 100;
      invalidDataPoint.speed = 1.0;

      const invalidDto = {
        data: [invalidDataPoint],
      } as UpdateSignalDto;

      service.update.mockRejectedValue(new Error('Validation failed'));

      // Act & Assert
      await expect(controller.update(signalId, invalidDto)).rejects.toThrow('Validation failed');
      expect(service.update).toHaveBeenCalledWith(
        signalId,
        expect.objectContaining({
          data: arrayContaining([{ timestamp: anyNumber(), lat: 200, lon: 100, speed: 1.0 }]), // DataPoint format
        })
      );
    });
  });

  describe('remove', () => {
    it('should delete a signal successfully', async () => {
      // Arrange
      const signalId = 'mock-signal-id';
      service.remove.mockResolvedValue(true);

      // Act
      const result = await controller.remove(signalId);

      // Assert
      expect(result).toEqual({ deleted: true });
      expect(service.remove).toHaveBeenCalledWith(signalId);
    });

    it('should handle deletion of non-existent signal', async () => {
      // Arrange
      const signalId = 'non-existent-id';
      service.remove.mockResolvedValue(false);

      // Act
      const result = await controller.remove(signalId);

      // Assert
      expect(result).toEqual({ deleted: false });
      expect(service.remove).toHaveBeenCalledWith(signalId);
    });
  });
});
