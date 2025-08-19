import { Injectable, Logger } from '@nestjs/common';
import { CircuitBreakerState, RetryOptions, createCircuitBreakerError } from '../types';

@Injectable()
export class ErrorHandlingService {
  private readonly logger = new Logger(ErrorHandlingService.name);
  private maxRetries = 3;
  private retryDelays = [1000, 5000, 15000]; // 1s, 5s, 15s

  constructor() {}

  /**
   * Retry mechanism with exponential backoff
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: Record<string, unknown>
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await operation();
        if (attempt > 1) {
          this.logger.log(`Operation '${operationName}' succeeded on attempt ${attempt}`);
        }
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        this.logger.warn(
          `Operation '${operationName}' failed on attempt ${attempt}/${this.maxRetries}: ${lastError.message}`,
          { context, error: lastError.stack }
        );

        if (attempt === this.maxRetries) {
          break;
        }

        // Wait before retry
        const delay = this.retryDelays[attempt - 1];
        this.logger.log(`Waiting ${delay}ms before retry...`);
        await this.sleep(delay);
      }
    }

    // All retries exhausted, log the error
    this.logger.error(`Operation '${operationName}' failed after ${this.maxRetries} attempts.`, {
      context,
      error: lastError!.message,
    });

    throw lastError!;
  }

  /**
   * Circuit breaker pattern implementation
   */
  private circuitBreakers = new Map<string, CircuitBreakerState>();

  async withCircuitBreaker<T>(
    operation: () => Promise<T>,
    operationName: string,
    threshold: number = 5,
    timeout: number = 60000
  ): Promise<T> {
    const circuitBreaker = this.getOrCreateCircuitBreaker(operationName, threshold, timeout);

    if (circuitBreaker.state === 'OPEN') {
      if (Date.now() - circuitBreaker.lastFailureTime > circuitBreaker.timeout) {
        circuitBreaker.state = 'HALF_OPEN';
        this.logger.log(`Circuit breaker for '${operationName}' moved to HALF_OPEN state`);
      } else {
        throw createCircuitBreakerError(
          `Circuit breaker is OPEN for operation: ${operationName}`,
          operationName,
          'OPEN',
          circuitBreaker.failures,
          circuitBreaker.threshold,
          circuitBreaker.timeout
        );
      }
    }

    try {
      const result = await operation();

      if (circuitBreaker.state === 'HALF_OPEN') {
        circuitBreaker.state = 'CLOSED';
        circuitBreaker.failures = 0;
        this.logger.log(`Circuit breaker for '${operationName}' moved to CLOSED state`);
      }

      return result;
    } catch (error) {
      circuitBreaker.failures++;
      circuitBreaker.lastFailureTime = Date.now();

      if (circuitBreaker.failures >= circuitBreaker.threshold) {
        circuitBreaker.state = 'OPEN';
        this.logger.error(
          `Circuit breaker for '${operationName}' moved to OPEN state after ${circuitBreaker.failures} failures`
        );
      }

      throw error;
    }
  }

  private getOrCreateCircuitBreaker(
    operationName: string,
    threshold: number,
    timeout: number
  ): CircuitBreakerState {
    if (!this.circuitBreakers.has(operationName)) {
      this.circuitBreakers.set(operationName, {
        failures: 0,
        lastFailureTime: 0,
        state: 'CLOSED',
        threshold,
        timeout,
      });
    }
    return this.circuitBreakers.get(operationName)!;
  }

  /**
   * Utility function for sleeping
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(operationName: string): CircuitBreakerState | undefined {
    return this.circuitBreakers.get(operationName);
  }

  /**
   * Reset circuit breaker for an operation
   */
  resetCircuitBreaker(operationName: string): void {
    const circuitBreaker = this.circuitBreakers.get(operationName);
    if (circuitBreaker) {
      circuitBreaker.state = 'CLOSED';
      circuitBreaker.failures = 0;
      circuitBreaker.lastFailureTime = 0;
      this.logger.log(`Circuit breaker for '${operationName}' has been reset`);
    }
  }

  /**
   * Get retry options for an operation
   */
  getRetryOptions(operationName: string): RetryOptions {
    return {
      maxRetries: this.maxRetries,
      retryDelays: this.retryDelays,
      operationName,
    };
  }

  /**
   * Set retry configuration
   */
  setRetryConfig(maxRetries: number, retryDelays: number[]): void {
    this.maxRetries = maxRetries;
    this.retryDelays = retryDelays;
  }
}
