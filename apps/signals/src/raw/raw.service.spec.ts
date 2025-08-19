import { Test, TestingModule } from '@nestjs/testing';
import { RawService } from './raw.service';
import { IRawStore } from './interfaces';
// No Nest/Mongoose deps needed; we inject the IRawStore directly

describe('RawService', () => {
  let service: RawService;
  let mockRawStore: jest.Mocked<IRawStore>;

  beforeEach(async () => {
    // Create mock raw store
    mockRawStore = {
      store: jest.fn(),
      getPresignedUrl: jest.fn(),
      getMetadata: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      getFileSize: jest.fn(),
      getStorageStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RawService, { provide: 'IRawStore', useValue: mockRawStore }],
    }).compile();

    service = module.get<RawService>(RawService);
    jest.clearAllMocks();
  });

  describe('store', () => {
    it('should store data successfully', async () => {
      const testData = {
        deviceId: 'test-device',
        data: [{ timestamp: 1234567890, coordinates: [1.0, 2.0, 3.0] as [number, number, number] }],
        time: Date.now(),
      };
      const mockRef = 'mock-ref-123';

      mockRawStore.store.mockResolvedValue(mockRef);

      const result = await service.store(testData);

      expect(result).toBe(mockRef);
    });

    it('should handle storage errors gracefully', async () => {
      const testData = {
        deviceId: 'test-device',
        data: [{ timestamp: 1234567890, coordinates: [1.0, 2.0, 3.0] as [number, number, number] }],
        time: Date.now(),
      };

      mockRawStore.store.mockRejectedValue(new Error('Storage failed'));

      await expect(service.store(testData)).rejects.toThrow('Storage failed');
    });
  });

  describe('getPresignedUrl', () => {
    it('should return presigned URL successfully', async () => {
      const ref = 'test-ref';
      const ttlSec = 3600;
      const mockUrl = 'https://example.com/presigned-url';

      mockRawStore.getPresignedUrl.mockResolvedValue(mockUrl);

      const result = await service.getPresignedUrl(ref, ttlSec);

      expect(result).toBe(mockUrl);
    });
  });

  describe('getMetadata', () => {
    it('should return metadata successfully', async () => {
      const ref = 'test-ref';
      const mockMetadata = {
        id: 'test-ref',
        size: 1024,
        hash: 'test-hash',
        url: undefined,
      };

      mockRawStore.getMetadata.mockResolvedValue(mockMetadata);

      const result = await service.getMetadata(ref);

      expect(result).toEqual(mockMetadata);
    });
  });

  describe('delete', () => {
    it('should delete file successfully', async () => {
      const ref = 'test-ref';

      mockRawStore.delete.mockResolvedValue(true);

      const result = await service.delete(ref);

      expect(result).toBe(true);
    });
  });

  describe('exists', () => {
    it('should check file existence successfully', async () => {
      const ref = 'test-ref';

      mockRawStore.exists.mockResolvedValue(true);

      const result = await service.exists(ref);

      expect(result).toBe(true);
    });
  });

  describe('getFileSize', () => {
    it('should return file size successfully', async () => {
      const ref = 'test-ref';
      const mockSize = 1024;

      mockRawStore.getFileSize.mockResolvedValue(mockSize);

      const result = await service.getFileSize(ref);

      expect(result).toBe(mockSize);
    });
  });

  describe('getStorageStats', () => {
    it('should return storage statistics successfully', async () => {
      const mockStats = {
        totalFiles: 10,
        totalSize: 10240,
        avgFileSize: 1024,
        storageSize: 1024,
        indexSize: 2048,
      };

      mockRawStore.getStorageStats.mockResolvedValue(mockStats);

      const result = await service.getStorageStats();

      expect(result).toEqual(mockStats);
    });
  });

  describe('error handling', () => {
    it('should propagate errors from underlying raw store', async () => {
      const testData = {
        deviceId: 'test-device',
        data: [{ timestamp: 1234567890, coordinates: [1.0, 2.0, 3.0] as [number, number, number] }],
        time: Date.now(),
      };

      mockRawStore.store.mockRejectedValue(new Error('Underlying error'));

      await expect(service.store(testData)).rejects.toThrow('Underlying error');
    });
  });
});
