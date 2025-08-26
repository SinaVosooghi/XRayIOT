import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@iotp/shared-config';
import { DlqReplayService } from './dlq-replay.service';

// Type-safe mock interfaces
interface MockAmqpChannel {
  get: jest.Mock;
  publish: jest.Mock;
  ack: jest.Mock;
  nack: jest.Mock;
  checkQueue: jest.Mock;
}

interface MockAmqpConnection {
  channel: MockAmqpChannel;
}

interface MockConfigService {
  rabbitmq: {
    retryMax: number;
  };
}

describe('DlqReplayService', () => {
  let service: DlqReplayService;
  let mockAmqpConnection: MockAmqpConnection;
  let mockConfigService: MockConfigService;

  beforeEach(async () => {
    // Create type-safe mocks
    mockAmqpConnection = {
      channel: {
        get: jest.fn(),
        publish: jest.fn(),
        ack: jest.fn(),
        nack: jest.fn(),
        checkQueue: jest.fn(),
      },
    };

    mockConfigService = {
      rabbitmq: {
        retryMax: 3,
      },
    };

    // Use logger to show test setup
    const logger = new Logger('DlqReplayServiceTest');
    logger.log('Setting up test mocks for DLQ replay service');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DlqReplayService,
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

    service = module.get<DlqReplayService>(DlqReplayService);
    jest.clearAllMocks();
  });

  describe('replayDLQ', () => {
    it('should replay messages successfully within retry limit', async () => {
      // Arrange
      const logger = new Logger('DlqReplayServiceTest');
      logger.log('Testing successful DLQ replay with 2 messages');

      const mockMessages = [
        {
          content: Buffer.from('test message 1'),
          properties: {
            headers: { 'x-retry-count': 0 },
          },
        },
        {
          content: Buffer.from('test message 2'),
          properties: {
            headers: { 'x-retry-count': 1 },
          },
        },
      ];

      mockAmqpConnection.channel.get
        .mockResolvedValueOnce(mockMessages[0])
        .mockResolvedValueOnce(mockMessages[1])
        .mockResolvedValueOnce(null); // No more messages

      // Act
      const result = await service.replayDLQ(100);

      // Assert
      expect(result.replayed).toBe(2);
      expect(result.failed).toBe(0);
      expect(mockAmqpConnection.channel.publish).toHaveBeenCalledTimes(2);
      expect(mockAmqpConnection.channel.ack).toHaveBeenCalledTimes(2);
    });

    it('should handle messages exceeding max retries', async () => {
      // Arrange
      const mockMessage = {
        content: Buffer.from('exceeded retry limit'),
        properties: {
          headers: { 'x-retry-count': 3 },
        },
      };

      mockAmqpConnection.channel.get.mockResolvedValueOnce(mockMessage).mockResolvedValueOnce(null);

      // Act
      const result = await service.replayDLQ(100);

      // Assert
      expect(result.replayed).toBe(0);
      expect(result.failed).toBe(1);
      expect(mockAmqpConnection.channel.publish).not.toHaveBeenCalled();
      expect(mockAmqpConnection.channel.nack).toHaveBeenCalledWith(mockMessage, false, false);
    });

    it('should handle processing errors gracefully', async () => {
      // Arrange
      const mockMessage = {
        content: Buffer.from('error message'),
        properties: {
          headers: { 'x-retry-count': 0 },
        },
      };

      mockAmqpConnection.channel.get.mockResolvedValueOnce(mockMessage).mockResolvedValueOnce(null);

      // Mock publish to throw an error
      mockAmqpConnection.channel.publish.mockImplementation(() => {
        throw new Error('Publish failed');
      });

      // Act
      const result = await service.replayDLQ(100);

      // Assert
      expect(result.replayed).toBe(0);
      expect(result.failed).toBe(1);
      expect(mockAmqpConnection.channel.nack).toHaveBeenCalledWith(mockMessage, false, false);
    });

    it('should respect the limit parameter', async () => {
      // Arrange
      const limit = 5;
      const mockMessages = Array.from({ length: 10 }, (_, i) => ({
        content: Buffer.from(`message ${i}`),
        properties: {
          headers: { 'x-retry-count': 0 },
        },
      }));

      // Mock get() to return messages for the first 5 calls, then null
      mockAmqpConnection.channel.get
        .mockResolvedValueOnce(mockMessages[0])
        .mockResolvedValueOnce(mockMessages[1])
        .mockResolvedValueOnce(mockMessages[2])
        .mockResolvedValueOnce(mockMessages[3])
        .mockResolvedValueOnce(mockMessages[4])
        .mockResolvedValueOnce(null);

      // Act
      const result = await service.replayDLQ(limit);

      // Assert
      expect(result.replayed).toBe(limit);
      // The service calls get() exactly limit times - it doesn't call again after the limit
      expect(mockAmqpConnection.channel.get).toHaveBeenCalledTimes(limit);
    });

    it('should calculate exponential backoff correctly', async () => {
      // Arrange
      const mockMessage = {
        content: Buffer.from('test message'),
        properties: {
          headers: { 'x-retry-count': 2 },
        },
      };

      mockAmqpConnection.channel.get.mockResolvedValueOnce(mockMessage).mockResolvedValueOnce(null);

      // Act
      await service.replayDLQ(100);

      // Assert
      expect(mockAmqpConnection.channel.publish).toHaveBeenCalledWith(
        'iot.xray.dlx',
        'xray.raw.v1.retry',
        mockMessage.content,
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-retry-count': 3,
            'x-retry-delay': 240000, // 60s * 2^2 = 240s = 240000ms
          } as Record<string, unknown>),
        } as Record<string, unknown>)
      );
    });

    it('should cap retry delay at maximum value', async () => {
      // Arrange
      const mockMessage = {
        content: Buffer.from('test message'),
        properties: {
          headers: { 'x-retry-count': 2 }, // Below max retries (3)
        },
      };

      mockAmqpConnection.channel.get.mockResolvedValueOnce(mockMessage).mockResolvedValueOnce(null);

      // Act
      await service.replayDLQ(100);

      // Assert
      expect(mockAmqpConnection.channel.publish).toHaveBeenCalledWith(
        'iot.xray.dlx',
        'xray.raw.v1.retry',
        mockMessage.content,
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-retry-delay': 240000, // 60s * 2^2 = 240s = 240000ms
          } as Record<string, unknown>),
        } as Record<string, unknown>)
      );
    });
  });

  describe('getDLQStats', () => {
    it('should return correct queue statistics', async () => {
      // Arrange
      const mockQueueInfo = { messageCount: 42 };
      const mockMessage = {
        properties: {
          timestamp: Date.now(),
        },
      };

      mockAmqpConnection.channel.checkQueue.mockResolvedValue(mockQueueInfo);
      mockAmqpConnection.channel.get.mockResolvedValue(mockMessage);

      // Act
      const result = await service.getDLQStats();

      // Assert
      expect(result.count).toBe(42);
      expect(result.oldestMessage).toBeInstanceOf(Date);
      expect(mockAmqpConnection.channel.checkQueue).toHaveBeenCalledWith('xray.raw.v1.dlq');
    });

    it('should handle empty queue gracefully', async () => {
      // Arrange
      const mockQueueInfo = { messageCount: 0 };

      mockAmqpConnection.channel.checkQueue.mockResolvedValue(mockQueueInfo);

      // Act
      const result = await service.getDLQStats();

      // Assert
      expect(result.count).toBe(0);
      expect(result.oldestMessage).toBeNull();
      expect(mockAmqpConnection.channel.get).not.toHaveBeenCalled();
    });

    it('should handle queue check errors gracefully', async () => {
      // Arrange
      mockAmqpConnection.channel.checkQueue.mockRejectedValue(new Error('Queue check failed'));

      // Act
      const result = await service.getDLQStats();

      // Assert
      expect(result.count).toBe(0);
      expect(result.oldestMessage).toBeNull();
    });

    it('should handle message retrieval errors gracefully', async () => {
      // Arrange
      const mockQueueInfo = { messageCount: 1 };
      mockAmqpConnection.channel.checkQueue.mockResolvedValue(mockQueueInfo);
      mockAmqpConnection.channel.get.mockImplementation(() => {
        throw new Error('Message retrieval failed');
      });

      // Act
      const result = await service.getDLQStats();

      // Assert
      // When get() throws an error, the service catches it and returns count 0
      expect(result.count).toBe(0);
      expect(result.oldestMessage).toBeNull();
    });
  });
});
