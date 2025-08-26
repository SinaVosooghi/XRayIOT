import { Test, TestingModule } from '@nestjs/testing';
import { RetryPolicyService, RetryPolicy } from './retry-policy.service';

describe('RetryPolicyService', () => {
  let service: RetryPolicyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RetryPolicyService],
    }).compile();

    service = module.get<RetryPolicyService>(RetryPolicyService);
  });

  describe('calculateDelay', () => {
    it('should calculate exponential backoff correctly', () => {
      // Arrange
      const attempt = 2;
      const policy: Partial<RetryPolicy> = {
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        jitter: false, // Disable jitter for predictable testing
      };

      // Act
      const delay = service.calculateDelay(attempt, policy);

      // Assert
      // 1000 * 2^2 = 4000ms
      expect(delay).toBe(4000);
    });

    it('should cap delay at maximum value', () => {
      // Arrange
      const attempt = 5;
      const policy: Partial<RetryPolicy> = {
        initialDelay: 1000,
        maxDelay: 5000,
        backoffMultiplier: 2,
        maxAttempts: 10, // Increase max attempts to avoid error
        jitter: false, // Disable jitter for predictable testing
      };

      // Act
      const delay = service.calculateDelay(attempt, policy);

      // Assert
      // Should be capped at 5000ms, not 1000 * 2^5 = 32000ms
      expect(delay).toBe(5000);
    });

    it('should handle zero attempt', () => {
      // Arrange
      const attempt = 0;
      const policy: Partial<RetryPolicy> = {
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        jitter: false, // Disable jitter for predictable testing
      };

      // Act
      const delay = service.calculateDelay(attempt, policy);

      // Assert
      // 1000 * 2^0 = 1000ms
      expect(delay).toBe(1000);
    });

    it('should handle large attempt numbers', () => {
      // Arrange
      const attempt = 10;
      const policy: Partial<RetryPolicy> = {
        initialDelay: 100,
        maxDelay: 10000,
        backoffMultiplier: 2,
        maxAttempts: 15, // Increase max attempts to avoid error
        jitter: false, // Disable jitter for predictable testing
      };

      // Act
      const delay = service.calculateDelay(attempt, policy);

      // Assert
      // Should be capped at 10000ms
      expect(delay).toBe(10000);
    });
  });

  describe('jitter behavior', () => {
    it('should add jitter when enabled', () => {
      // Arrange
      const attempt = 1;
      const policyWithJitter: Partial<RetryPolicy> = {
        initialDelay: 1000,
        jitter: true,
      };
      const policyWithoutJitter: Partial<RetryPolicy> = {
        initialDelay: 1000,
        jitter: false,
      };

      // Act
      const delayWithJitter = service.calculateDelay(attempt, policyWithJitter);
      const delayWithoutJitter = service.calculateDelay(attempt, policyWithoutJitter);

      // Assert
      // With jitter, delay should vary slightly
      expect(delayWithJitter).toBeGreaterThanOrEqual(1800); // 2000 * 0.8 (with jitter)
      expect(delayWithJitter).toBeLessThanOrEqual(2200); // 2000 * 1.2 (with jitter)
      expect(delayWithoutJitter).toBe(2000); // No jitter
    });

    it('should handle jitter variations', () => {
      // Arrange
      const attempt = 1;
      const policy: Partial<RetryPolicy> = {
        initialDelay: 1000,
        jitter: true,
      };

      // Act
      const delay1 = service.calculateDelay(attempt, policy);
      const delay2 = service.calculateDelay(attempt, policy);
      const delay3 = service.calculateDelay(attempt, policy);

      // Assert
      // All delays should be within expected range
      [delay1, delay2, delay3].forEach(delay => {
        expect(delay).toBeGreaterThanOrEqual(1800);
        expect(delay).toBeLessThanOrEqual(2200);
      });
    });
  });

  describe('delay calculation with different policies', () => {
    it('should handle different initial delays', () => {
      // Arrange
      const attempt = 1;
      const policy1: Partial<RetryPolicy> = {
        initialDelay: 500,
        jitter: false, // Disable jitter for predictable testing
      };
      const policy2: Partial<RetryPolicy> = {
        initialDelay: 2000,
        jitter: false, // Disable jitter for predictable testing
      };

      // Act
      const delay1 = service.calculateDelay(attempt, policy1);
      const delay2 = service.calculateDelay(attempt, policy2);

      // Assert
      expect(delay1).toBe(1000); // 500 * 2^1 = 1000ms
      expect(delay2).toBe(4000); // 2000 * 2^1 = 4000ms
    });

    it('should handle different backoff multipliers', () => {
      // Arrange
      const attempt = 2;
      const policy1: Partial<RetryPolicy> = {
        backoffMultiplier: 1.5,
        jitter: false, // Disable jitter for predictable testing
      };
      const policy2: Partial<RetryPolicy> = {
        backoffMultiplier: 3,
        jitter: false, // Disable jitter for predictable testing
      };

      // Act
      const delay1 = service.calculateDelay(attempt, policy1);
      const delay2 = service.calculateDelay(attempt, policy2);

      // Assert
      expect(delay1).toBe(2250); // 1000 * 1.5^2 = 2250ms
      expect(delay2).toBe(9000); // 1000 * 3^2 = 9000ms
    });
  });

  describe('shouldRetry', () => {
    it('should return true for transient errors within retry limit', () => {
      // Arrange
      const error = new Error('Connection timeout');
      const attempt = 2;
      const policy: Partial<RetryPolicy> = { maxAttempts: 5 };

      // Act
      const result = service.shouldRetry(error, attempt, policy);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when attempt equals max', () => {
      // Arrange
      const error = new Error('Network error');
      const attempt = 3;
      const policy: Partial<RetryPolicy> = { maxAttempts: 3 };

      // Act
      const result = service.shouldRetry(error, attempt, policy);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when attempt exceeds max', () => {
      // Arrange
      const error = new Error('Temporary failure');
      const attempt = 5;
      const policy: Partial<RetryPolicy> = { maxAttempts: 3 };

      // Act
      const result = service.shouldRetry(error, attempt, policy);

      // Assert
      expect(result).toBe(false);
    });

    it('should not retry validation errors', () => {
      // Arrange
      const error = new Error('Invalid data format');
      const attempt = 1;
      const policy: Partial<RetryPolicy> = { maxAttempts: 3 };

      // Act
      const result = service.shouldRetry(error, attempt, policy);

      // Assert
      expect(result).toBe(false);
    });

    it('should retry transient errors', () => {
      // Arrange
      const transientErrors = [
        'connection timeout',
        'network failure',
        'temporary server error',
        'connection error',
      ];

      transientErrors.forEach(errorMessage => {
        const error = new Error(errorMessage);
        const attempt = 1;
        const policy: Partial<RetryPolicy> = { maxAttempts: 3 };

        // Act
        const result = service.shouldRetry(error, attempt, policy);

        // Assert
        expect(result).toBe(true);
      });
    });

    it('should retry specific transient error patterns', () => {
      // Test each keyword individually to ensure they work
      const testCases = [
        { message: 'timeout error', expected: true },
        { message: 'connection failed', expected: true },
        { message: 'network error', expected: true },
        { message: 'temporary failure', expected: true },
        { message: 'validation error', expected: false },
        { message: 'invalid data', expected: false },
      ];

      testCases.forEach(({ message, expected }) => {
        const error = new Error(message);
        const attempt = 1;
        const policy: Partial<RetryPolicy> = { maxAttempts: 3 };

        // Act
        const result = service.shouldRetry(error, attempt, policy);

        // Assert
        expect(result).toBe(expected);
      });
    });
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(typeof service.calculateDelay).toBe('function');
      expect(typeof service.shouldRetry).toBe('function');
    });
  });

  describe('error handling', () => {
    it('should throw error when max attempts exceeded', () => {
      // Arrange
      const attempt = 5;
      const policy: Partial<RetryPolicy> = { maxAttempts: 3 };

      // Act & Assert
      expect(() => service.calculateDelay(attempt, policy)).toThrow('Max retry attempts exceeded');
    });

    it('should handle minimum delay constraint', () => {
      // Arrange
      const attempt = 0;
      const policy: Partial<RetryPolicy> = {
        initialDelay: 50, // Below minimum 100ms
        jitter: false,
      };

      // Act
      const delay = service.calculateDelay(attempt, policy);

      // Assert
      expect(delay).toBe(100); // Should be capped at minimum
    });
  });
});
