import { Injectable } from '@nestjs/common';

export interface RetryPolicy {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

@Injectable()
export class RetryPolicyService {
  private readonly defaultPolicy: RetryPolicy = {
    maxAttempts: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 60000, // 1 minute
    backoffMultiplier: 2,
    jitter: true,
  };

  calculateDelay(attempt: number, policy: Partial<RetryPolicy> = {}): number {
    const config = { ...this.defaultPolicy, ...policy };

    if (attempt >= config.maxAttempts) {
      throw new Error('Max retry attempts exceeded');
    }

    let delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
    delay = Math.min(delay, config.maxDelay);

    if (config.jitter) {
      // Add random jitter (±20%)
      const jitter = delay * 0.2;
      delay += (Math.random() - 0.5) * jitter;
    }

    return Math.max(delay, 100); // Minimum 100ms
  }

  shouldRetry(error: Error, attempt: number, policy: Partial<RetryPolicy> = {}): boolean {
    const config = { ...this.defaultPolicy, ...policy };

    if (attempt >= config.maxAttempts) {
      return false;
    }

    // Don't retry on validation errors
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return false;
    }

    // Retry on transient errors
    const transientErrors = ['timeout', 'connection', 'network', 'temporary'];
    return transientErrors.some(keyword => error.message.toLowerCase().includes(keyword));
  }
}
