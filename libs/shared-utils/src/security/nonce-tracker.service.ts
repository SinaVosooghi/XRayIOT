import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '@iotp/shared-config';

@Injectable()
export class NonceTrackerService {
  private readonly logger = new Logger(NonceTrackerService.name);
  private readonly redis: Redis;
  private readonly nonceTtl: number;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis(this.configService.redis.uri);
    this.nonceTtl = this.configService.hmac.nonceTtl;
  }

  /**
   * Check if nonce has been used and mark it as used
   * Uses Redis SET with NX (only if not exists) and EX (expiration)
   */
  async isNonceUsed(nonce: string, deviceId: string): Promise<boolean> {
    try {
      const key = `nonce:${deviceId}:${nonce}`;
      
      // Try to set the nonce with expiration (NX = only if not exists)
      const result = await this.redis.set(key, '1', 'EX', this.nonceTtl, 'NX');
      
      if (result === 'OK') {
        // Nonce was successfully set (not previously used)
        this.logger.debug('Nonce marked as used', { nonce, deviceId, ttl: this.nonceTtl });
        return false;
      } else {
        // Nonce already exists (was previously used)
        this.logger.warn('Nonce replay detected', { nonce, deviceId });
        return true;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to check nonce usage', { error: errorMessage, nonce, deviceId });
      // In case of Redis failure, allow the request to prevent DoS
      // In production, consider failing closed for security
      return false;
    }
  }

  /**
   * Get nonce usage statistics
   */
  async getNonceStats(deviceId?: string): Promise<{
    totalNonces: number;
    deviceNonces?: number;
    oldestNonce?: string;
    newestNonce?: string;
  }> {
    try {
      if (deviceId) {
        // Get device-specific nonces
        const pattern = `nonce:${deviceId}:*`;
        const keys = await this.redis.keys(pattern);
        
        if (keys.length === 0) {
          return { totalNonces: 0, deviceNonces: 0 };
        }

        // Get TTL for oldest and newest nonces
        const ttls = await Promise.all(keys.map((key: string) => this.redis.ttl(key)));
        const sortedKeys = keys.sort((a: string, b: string) => {
          const indexA = keys.indexOf(a);
          const indexB = keys.indexOf(b);
          return ttls[indexA] - ttls[indexB];
        });

        return {
          totalNonces: keys.length,
          deviceNonces: keys.length,
          oldestNonce: sortedKeys[0],
          newestNonce: sortedKeys[sortedKeys.length - 1],
        };
      } else {
        // Get all nonces
        const keys = await this.redis.keys('nonce:*');
        return { totalNonces: keys.length };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to get nonce statistics', { error: errorMessage, deviceId });
      return { totalNonces: 0 };
    }
  }

  /**
   * Clean up expired nonces (cleanup job)
   */
  async cleanupExpiredNonces(): Promise<number> {
    try {
      // Redis automatically expires keys, but we can also clean up manually
      const keys = await this.redis.keys('nonce:*');
      let cleanedCount = 0;

      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl <= 0) {
          await this.redis.del(key);
          cleanedCount++;
        }
      }

      this.logger.log('Nonce cleanup completed', { cleanedCount, totalKeys: keys.length });
      return cleanedCount;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to cleanup expired nonces', { error: errorMessage });
      return 0;
    }
  }

  /**
   * Get nonce TTL for a specific nonce
   */
  async getNonceTtl(nonce: string, deviceId: string): Promise<number> {
    try {
      const key = `nonce:${deviceId}:${nonce}`;
      return await this.redis.ttl(key);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to get nonce TTL', { error: errorMessage, nonce, deviceId });
      return -1;
    }
  }

  /**
   * Extend nonce TTL (useful for long-running operations)
   */
  async extendNonceTtl(nonce: string, deviceId: string, additionalTtl: number): Promise<boolean> {
    try {
      const key = `nonce:${deviceId}:${nonce}`;
      const currentTtl = await this.redis.ttl(key);
      
      if (currentTtl > 0) {
        const newTtl = currentTtl + additionalTtl;
        await this.redis.expire(key, newTtl);
        this.logger.debug('Extended nonce TTL', { nonce, deviceId, newTtl });
        return true;
      }
      
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to extend nonce TTL', { error: errorMessage, nonce, deviceId });
      return false;
    }
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Redis health check failed', { error: errorMessage });
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async onApplicationShutdown(): Promise<void> {
    try {
      await this.redis.quit();
      this.logger.log('Redis connection closed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to close Redis connection', { error: errorMessage });
    }
  }
}
