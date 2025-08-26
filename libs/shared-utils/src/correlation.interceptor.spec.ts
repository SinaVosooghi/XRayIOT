import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { CorrelationIdInterceptor } from './correlation.interceptor';

// Type-safe mock interfaces
interface MockExecutionContext {
  switchToHttp: () => {
    getRequest: () => { correlationId?: string };
  };
}

interface MockCallHandler {
  handle: jest.Mock;
}

describe('CorrelationIdInterceptor', () => {
  let interceptor: CorrelationIdInterceptor;
  let mockExecutionContext: MockExecutionContext;
  let mockCallHandler: MockCallHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CorrelationIdInterceptor],
    }).compile();

    interceptor = module.get<CorrelationIdInterceptor>(CorrelationIdInterceptor);

    // Create type-safe mocks
    mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({ correlationId: 'test-correlation-id' }),
      }),
    };

    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of('test result')),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('should intercept and log correlation ID successfully', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const testCorrelationId = 'test-correlation-123';
      mockExecutionContext.switchToHttp = () => ({
        getRequest: () => ({ correlationId: testCorrelationId }),
      });

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
        .toPromise();

      // Assert
      expect(result).toBe('test result');
      expect(consoleSpy).toHaveBeenCalledWith(`Request completed: ${testCorrelationId}`);
      consoleSpy.mockRestore();
    });

    it('should handle request without correlation ID', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockExecutionContext.switchToHttp = () => ({
        getRequest: () => ({ correlationId: undefined }),
      });

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
        .toPromise();

      // Assert
      expect(result).toBe('test result');
      expect(consoleSpy).toHaveBeenCalledWith('Request completed: unknown');
      consoleSpy.mockRestore();
    });

    it('should handle request with empty correlation ID', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockExecutionContext.switchToHttp = () => ({
        getRequest: () => ({ correlationId: '' }),
      });

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
        .toPromise();

      // Assert
      expect(result).toBe('test result');
      expect(consoleSpy).toHaveBeenCalledWith('Request completed: unknown');
      consoleSpy.mockRestore();
    });

    it('should handle request with whitespace correlation ID', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockExecutionContext.switchToHttp = () => ({
        getRequest: () => ({ correlationId: '   ' }),
      });

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
        .toPromise();

      // Assert
      expect(result).toBe('test result');
      // The interceptor preserves whitespace, so it should log the actual value
      expect(consoleSpy).toHaveBeenCalledWith('Request completed:    ');
      consoleSpy.mockRestore();
    });

    it('should handle request with null correlation ID', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockExecutionContext.switchToHttp = () => ({
        getRequest: () => ({ correlationId: null as unknown as string }),
      });

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
        .toPromise();

      // Assert
      expect(result).toBe('test result');
      expect(consoleSpy).toHaveBeenCalledWith('Request completed: unknown');
      consoleSpy.mockRestore();
    });

    it('should handle request with undefined correlation ID property', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockExecutionContext.switchToHttp = () => ({
        getRequest: () => ({}),
      });

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
        .toPromise();

      // Assert
      expect(result).toBe('test result');
      expect(consoleSpy).toHaveBeenCalledWith('Request completed: unknown');
      consoleSpy.mockRestore();
    });

    it('should handle request with valid correlation ID', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const validCorrelationId = 'valid-uuid-12345-67890-abcdef';
      mockExecutionContext.switchToHttp = () => ({
        getRequest: () => ({ correlationId: validCorrelationId }),
      });

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
        .toPromise();

      // Assert
      expect(result).toBe('test result');
      expect(consoleSpy).toHaveBeenCalledWith(`Request completed: ${validCorrelationId}`);
      consoleSpy.mockRestore();
    });

    it('should handle request with UUID format correlation ID', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const uuidCorrelationId = '550e8400-e29b-41d4-a716-446655440000';
      mockExecutionContext.switchToHttp = () => ({
        getRequest: () => ({ correlationId: uuidCorrelationId }),
      });

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
        .toPromise();

      // Assert
      expect(result).toBe('test result');
      expect(consoleSpy).toHaveBeenCalledWith(`Request completed: ${uuidCorrelationId}`);
      consoleSpy.mockRestore();
    });

    it('should handle request with special characters in correlation ID', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const specialCorrelationId = 'correlation-id-with-special-chars!@#$%^&*()';
      mockExecutionContext.switchToHttp = () => ({
        getRequest: () => ({ correlationId: specialCorrelationId }),
      });

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
        .toPromise();

      // Assert
      expect(result).toBe('test result');
      expect(consoleSpy).toHaveBeenCalledWith(`Request completed: ${specialCorrelationId}`);
      consoleSpy.mockRestore();
    });

    it('should handle request with very long correlation ID', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const longCorrelationId = 'a'.repeat(1000);
      mockExecutionContext.switchToHttp = () => ({
        getRequest: () => ({ correlationId: longCorrelationId }),
      });

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
        .toPromise();

      // Assert
      expect(result).toBe('test result');
      expect(consoleSpy).toHaveBeenCalledWith(`Request completed: ${longCorrelationId}`);
      consoleSpy.mockRestore();
    });

    it('should handle request with numeric correlation ID', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const numericCorrelationId = '12345';
      mockExecutionContext.switchToHttp = () => ({
        getRequest: () => ({ correlationId: numericCorrelationId }),
      });

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
        .toPromise();

      // Assert
      expect(result).toBe('test result');
      expect(consoleSpy).toHaveBeenCalledWith(`Request completed: ${numericCorrelationId}`);
      consoleSpy.mockRestore();
    });

    it('should handle request with boolean correlation ID', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const booleanCorrelationId = 'true';
      mockExecutionContext.switchToHttp = () => ({
        getRequest: () => ({ correlationId: booleanCorrelationId }),
      });

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
        .toPromise();

      // Assert
      expect(result).toBe('test result');
      expect(consoleSpy).toHaveBeenCalledWith(`Request completed: ${booleanCorrelationId}`);
      consoleSpy.mockRestore();
    });
  });

  describe('interceptor initialization', () => {
    it('should be defined', () => {
      expect(interceptor).toBeDefined();
    });

    it('should implement NestInterceptor interface', () => {
      expect(typeof interceptor.intercept).toBe('function');
    });
  });

  describe('observable handling', () => {
    it('should return observable from call handler', async () => {
      // Arrange
      const testData = { message: 'test data' };
      mockCallHandler.handle.mockReturnValue(of(testData));

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
        .toPromise();

      // Assert
      expect(result).toEqual(testData);
    });

    it('should handle empty observable', async () => {
      // Arrange
      mockCallHandler.handle.mockReturnValue(of(undefined));

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
        .toPromise();

      // Assert
      expect(result).toBeUndefined();
    });

    it('should handle null observable', async () => {
      // Arrange
      mockCallHandler.handle.mockReturnValue(of(null));

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
        .toPromise();

      // Assert
      expect(result).toBeNull();
    });

    it('should handle array observable', async () => {
      // Arrange
      const testArray = [1, 2, 3, 4, 5];
      mockCallHandler.handle.mockReturnValue(of(testArray));

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
        .toPromise();

      // Assert
      expect(result).toEqual(testArray);
    });

    it('should handle object observable', async () => {
      // Arrange
      const testObject = { key1: 'value1', key2: 'value2', nested: { deep: 'value' } };
      mockCallHandler.handle.mockReturnValue(of(testObject));

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
        .toPromise();

      // Assert
      expect(result).toEqual(testObject);
    });
  });

  describe('logging behavior', () => {
    it('should log exactly once per request', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const testCorrelationId = 'single-log-test';
      mockExecutionContext.switchToHttp = () => ({
        getRequest: () => ({ correlationId: testCorrelationId }),
      });

      // Act
      await interceptor
        .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
        .toPromise();

      // Assert
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(`Request completed: ${testCorrelationId}`);
      consoleSpy.mockRestore();
    });

    it('should log with correct format', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const testCorrelationId = 'format-test';
      mockExecutionContext.switchToHttp = () => ({
        getRequest: () => ({ correlationId: testCorrelationId }),
      });

      // Act
      await interceptor
        .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
        .toPromise();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/^Request completed: .+$/));
      consoleSpy.mockRestore();
    });
  });
});
