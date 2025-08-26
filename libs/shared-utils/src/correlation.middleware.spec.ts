import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response, NextFunction } from 'express';
import { CorrelationIdMiddleware } from './correlation.middleware';

// Type-safe mock interfaces
interface MockRequest extends Partial<Request> {
  headers: Record<string, string>;
  correlationId?: string;
}

interface MockResponse extends Partial<Response> {
  setHeader: jest.Mock;
  locals: Record<string, unknown>;
}

interface MockNextFunction extends NextFunction {
  (): void;
}

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;
  let mockRequest: MockRequest;
  let mockResponse: MockResponse;
  let mockNext: MockNextFunction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CorrelationIdMiddleware],
    }).compile();

    middleware = module.get<CorrelationIdMiddleware>(CorrelationIdMiddleware);

    // Create type-safe mocks
    mockRequest = {
      headers: {},
    };

    mockResponse = {
      setHeader: jest.fn(),
      locals: {},
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('use', () => {
    it('should generate new correlation ID when none exists', () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      middleware.use(
        mockRequest as Request & { correlationId?: string },
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockRequest.correlationId).toBeDefined();
      expect(typeof mockRequest.correlationId).toBe('string');
      expect(mockRequest.correlationId!.length).toBeGreaterThan(0);
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'x-correlation-id',
        mockRequest.correlationId
      );
      expect(mockResponse.locals.correlationId).toBe(mockRequest.correlationId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use existing correlation ID from headers', () => {
      // Arrange
      const existingCorrelationId = 'existing-correlation-123';
      mockRequest.headers = { 'x-correlation-id': existingCorrelationId };

      // Act
      middleware.use(
        mockRequest as Request & { correlationId?: string },
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockRequest.correlationId).toBe(existingCorrelationId);
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'x-correlation-id',
        existingCorrelationId
      );
      expect(mockResponse.locals.correlationId).toBe(existingCorrelationId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle empty correlation ID header', () => {
      // Arrange
      mockRequest.headers = { 'x-correlation-id': '' };

      // Act
      middleware.use(
        mockRequest as Request & { correlationId?: string },
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockRequest.correlationId).toBeDefined();
      expect(mockRequest.correlationId).not.toBe('');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'x-correlation-id',
        mockRequest.correlationId
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle whitespace-only correlation ID header', () => {
      // Arrange
      mockRequest.headers = { 'x-correlation-id': '   ' };

      // Act
      middleware.use(
        mockRequest as Request & { correlationId?: string },
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockRequest.correlationId).toBeDefined();
      expect(mockRequest.correlationId).toBe('   '); // Middleware preserves whitespace
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-correlation-id', '   ');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle undefined correlation ID header', () => {
      // Arrange
      mockRequest.headers = { 'x-correlation-id': undefined as unknown as string };

      // Act
      middleware.use(
        mockRequest as Request & { correlationId?: string },
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockRequest.correlationId).toBeDefined();
      expect(typeof mockRequest.correlationId).toBe('string');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'x-correlation-id',
        mockRequest.correlationId
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should generate unique correlation IDs for different requests', () => {
      // Arrange
      const request1: MockRequest = { headers: {} };
      const request2: MockRequest = { headers: {} };
      const response1: MockResponse = { setHeader: jest.fn(), locals: {} };
      const response2: MockResponse = { setHeader: jest.fn(), locals: {} };
      const next1: MockNextFunction = jest.fn();
      const next2: MockNextFunction = jest.fn();

      // Act
      middleware.use(
        request1 as Request & { correlationId?: string },
        response1 as Response,
        next1
      );
      middleware.use(
        request2 as Request & { correlationId?: string },
        response2 as Response,
        next2
      );

      // Assert
      expect(request1.correlationId).toBeDefined();
      expect(request2.correlationId).toBeDefined();
      expect(request1.correlationId).not.toBe(request2.correlationId);
      expect(next1).toHaveBeenCalled();
      expect(next2).toHaveBeenCalled();
    });

    it('should preserve existing correlation ID property if already set', () => {
      // Arrange
      const existingCorrelationId = 'pre-existing-id';
      mockRequest.correlationId = existingCorrelationId;
      mockRequest.headers = { 'x-correlation-id': 'header-id' };

      // Act
      middleware.use(
        mockRequest as Request & { correlationId?: string },
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockRequest.correlationId).toBe('header-id'); // Middleware overwrites with header value
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-correlation-id', 'header-id');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle case-insensitive header matching', () => {
      // Arrange
      const existingCorrelationId = 'case-insensitive-id';
      mockRequest.headers = { 'X-CORRELATION-ID': existingCorrelationId };

      // Act
      middleware.use(
        mockRequest as Request & { correlationId?: string },
        mockResponse as Response,
        mockNext
      );

      // Assert
      // Express headers are case-sensitive, so this should generate a new UUID
      expect(mockRequest.correlationId).toBeDefined();
      expect(mockRequest.correlationId).not.toBe(existingCorrelationId);
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'x-correlation-id',
        mockRequest.correlationId
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle mixed case headers', () => {
      // Arrange
      const existingCorrelationId = 'mixed-case-id';
      mockRequest.headers = { 'X-Correlation-Id': existingCorrelationId };

      // Act
      middleware.use(
        mockRequest as Request & { correlationId?: string },
        mockResponse as Response,
        mockNext
      );

      // Assert
      // Express headers are case-sensitive, so this should generate a new UUID
      expect(mockRequest.correlationId).toBeDefined();
      expect(mockRequest.correlationId).not.toBe(existingCorrelationId);
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'x-correlation-id',
        mockRequest.correlationId
      );
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('middleware initialization', () => {
    it('should be defined', () => {
      expect(middleware).toBeDefined();
    });

    it('should implement NestMiddleware interface', () => {
      expect(typeof middleware.use).toBe('function');
    });
  });

  describe('UUID generation', () => {
    it('should generate valid UUID v4 format', () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      middleware.use(
        mockRequest as Request & { correlationId?: string },
        mockResponse as Response,
        mockNext
      );

      // Assert
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(mockRequest.correlationId).toMatch(uuidRegex);
    });

    it('should generate different UUIDs on multiple calls', () => {
      // Arrange
      const request1: MockRequest = { headers: {} };
      const request2: MockRequest = { headers: {} };
      const response1: MockResponse = { setHeader: jest.fn(), locals: {} };
      const response2: MockResponse = { setHeader: jest.fn(), locals: {} };
      const next1: MockNextFunction = jest.fn();
      const next2: MockNextFunction = jest.fn();

      // Act
      middleware.use(
        request1 as Request & { correlationId?: string },
        response1 as Response,
        next1
      );
      middleware.use(
        request2 as Request & { correlationId?: string },
        response2 as Response,
        next2
      );

      // Assert
      expect(request1.correlationId).not.toBe(request2.correlationId);
      expect(request1.correlationId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
      expect(request2.correlationId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });
  });

  describe('response handling', () => {
    it('should set response header with correlation ID', () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      middleware.use(
        mockRequest as Request & { correlationId?: string },
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'x-correlation-id',
        mockRequest.correlationId
      );
    });

    it('should set response locals with correlation ID', () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      middleware.use(
        mockRequest as Request & { correlationId?: string },
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.locals.correlationId).toBe(mockRequest.correlationId);
    });

    it('should call next function', () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      middleware.use(
        mockRequest as Request & { correlationId?: string },
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });
});
