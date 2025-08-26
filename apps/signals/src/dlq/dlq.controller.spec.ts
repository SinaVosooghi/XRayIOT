import { Test, TestingModule } from '@nestjs/testing';
import { DlqController } from './dlq.controller';
import { DlqReplayService } from './dlq-replay.service';

// Type-safe mock interfaces
interface MockDlqReplayService {
  replayDLQ: jest.Mock<Promise<{ replayed: number; failed: number }>>;
  getDLQStats: jest.Mock<Promise<{ count: number; oldestMessage: Date | null }>>;
}

describe('DlqController', () => {
  let controller: DlqController;
  let mockDlqReplayService: MockDlqReplayService;

  beforeEach(async () => {
    // Create type-safe mocks
    mockDlqReplayService = {
      replayDLQ: jest.fn() as jest.Mock<Promise<{ replayed: number; failed: number }>>,
      getDLQStats: jest.fn() as jest.Mock<Promise<{ count: number; oldestMessage: Date | null }>>,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DlqController],
      providers: [
        {
          provide: DlqReplayService,
          useValue: mockDlqReplayService,
        },
      ],
    }).compile();

    controller = module.get<DlqController>(DlqController);
    jest.clearAllMocks();
  });

  describe('replayDLQ', () => {
    it('should replay DLQ messages with default limit', async () => {
      // Arrange
      const mockResult = { replayed: 5, failed: 2 };
      mockDlqReplayService.replayDLQ.mockResolvedValue(mockResult);

      // Act
      const result = await controller.replayDLQ();

      // Assert
      expect(result).toEqual({
        message: 'DLQ replay completed',
        replayed: 5,
        failed: 2,
      });
      expect(mockDlqReplayService.replayDLQ).toHaveBeenCalledWith(100);
    });

    it('should replay DLQ messages with custom limit', async () => {
      // Arrange
      const customLimit = 50;
      const mockResult = { replayed: 25, failed: 0 };
      mockDlqReplayService.replayDLQ.mockResolvedValue(mockResult);

      // Act
      const result = await controller.replayDLQ(customLimit);

      // Assert
      expect(result).toEqual({
        message: 'DLQ replay completed',
        replayed: 25,
        failed: 0,
      });
      expect(mockDlqReplayService.replayDLQ).toHaveBeenCalledWith(customLimit);
    });

    it('should handle replay service errors gracefully', async () => {
      // Arrange
      const errorMessage = 'DLQ replay failed';
      mockDlqReplayService.replayDLQ.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(controller.replayDLQ()).rejects.toThrow(errorMessage);
      expect(mockDlqReplayService.replayDLQ).toHaveBeenCalledWith(100);
    });

    it('should handle empty replay results', async () => {
      // Arrange
      const mockResult = { replayed: 0, failed: 0 };
      mockDlqReplayService.replayDLQ.mockResolvedValue(mockResult);

      // Act
      const result = await controller.replayDLQ();

      // Assert
      expect(result).toEqual({
        message: 'DLQ replay completed',
        replayed: 0,
        failed: 0,
      });
    });

    it('should handle partial replay results', async () => {
      // Arrange
      const mockResult = { replayed: 3, failed: 7 };
      mockDlqReplayService.replayDLQ.mockResolvedValue(mockResult);

      // Act
      const result = await controller.replayDLQ(10);

      // Assert
      expect(result).toEqual({
        message: 'DLQ replay completed',
        replayed: 3,
        failed: 7,
      });
      expect(mockDlqReplayService.replayDLQ).toHaveBeenCalledWith(10);
    });
  });

  describe('getDLQStats', () => {
    it('should return DLQ statistics successfully', async () => {
      // Arrange
      const mockStats = {
        count: 42,
        oldestMessage: new Date('2024-01-01T00:00:00Z'),
      };
      mockDlqReplayService.getDLQStats.mockResolvedValue(mockStats);

      // Act
      const result = await controller.getDLQStats();

      // Assert
      expect(result).toEqual(mockStats);
      expect(mockDlqReplayService.getDLQStats).toHaveBeenCalled();
    });

    it('should handle empty queue statistics', async () => {
      // Arrange
      const mockStats = {
        count: 0,
        oldestMessage: null,
      };
      mockDlqReplayService.getDLQStats.mockResolvedValue(mockStats);

      // Act
      const result = await controller.getDLQStats();

      // Assert
      expect(result).toEqual(mockStats);
      expect(result.count).toBe(0);
      expect(result.oldestMessage).toBeNull();
    });

    it('should handle statistics service errors gracefully', async () => {
      // Arrange
      const errorMessage = 'Failed to get DLQ stats';
      mockDlqReplayService.getDLQStats.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(controller.getDLQStats()).rejects.toThrow(errorMessage);
      expect(mockDlqReplayService.getDLQStats).toHaveBeenCalled();
    });

    it('should handle queue with messages but no timestamp', async () => {
      // Arrange
      const mockStats = {
        count: 15,
        oldestMessage: null,
      };
      mockDlqReplayService.getDLQStats.mockResolvedValue(mockStats);

      // Act
      const result = await controller.getDLQStats();

      // Assert
      expect(result).toEqual(mockStats);
      expect(result.count).toBe(15);
      expect(result.oldestMessage).toBeNull();
    });

    it('should handle large queue statistics', async () => {
      // Arrange
      const mockStats = {
        count: 10000,
        oldestMessage: new Date('2023-01-01T00:00:00Z'),
      };
      mockDlqReplayService.getDLQStats.mockResolvedValue(mockStats);

      // Act
      const result = await controller.getDLQStats();

      // Assert
      expect(result).toEqual(mockStats);
      expect(result.count).toBe(10000);
      expect(result.oldestMessage).toBeInstanceOf(Date);
      expect(result.oldestMessage!.getFullYear()).toBe(2023);
    });
  });

  describe('controller initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have required dependencies injected', () => {
      expect(mockDlqReplayService).toBeDefined();
      expect(mockDlqReplayService.replayDLQ).toBeDefined();
      expect(mockDlqReplayService.getDLQStats).toBeDefined();
    });
  });
});
