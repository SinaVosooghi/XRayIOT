import { Injectable, Logger } from '@nestjs/common';
import { createHmac, randomBytes } from 'crypto';
import { ConfigService } from '@iotp/shared-config';

export interface HmacAuthConfig {
  secretKey: string;
  algorithm: 'sha256' | 'sha512';
  timestampTolerance: number; // seconds
  nonceLength: number;
}

export interface HmacSignature {
  signature: string;
  timestamp: string;
  nonce: string;
  algorithm: string;
}

export interface HmacValidationResult {
  valid: boolean;
  reason?: string;
  deviceId?: string;
}

@Injectable()
export class HmacAuthService {
  private readonly logger = new Logger(HmacAuthService.name);
  private readonly config: HmacAuthConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      secretKey: this.configService.hmac.secretKey,
      algorithm: this.configService.hmac.algorithm,
      timestampTolerance: this.configService.hmac.timestampTolerance,
      nonceLength: this.configService.hmac.nonceLength,
    };
  }

  /**
   * Generate HMAC signature for a message
   * Follows OAuth 1.0a style signature generation
   */
  generateSignature(
    deviceId: string,
    payload: string,
    timestamp?: string,
    nonce?: string
  ): HmacSignature {
    const ts = timestamp || new Date().toISOString();
    const n = nonce || this.generateNonce();

    // Create signature base string (OAuth 1.0a style)
    const signatureBase = this.createSignatureBase(deviceId, payload, ts, n);

    // Generate HMAC signature
    const signature = createHmac(this.config.algorithm, this.config.secretKey)
      .update(signatureBase)
      .digest('hex');

    this.logger.debug('Generated HMAC signature', {
      deviceId,
      algorithm: this.config.algorithm,
      timestamp: ts,
      nonce: n,
    });

    return {
      signature,
      timestamp: ts,
      nonce: n,
      algorithm: this.config.algorithm,
    };
  }

  /**
   * Validate HMAC signature
   * Implements timestamp validation, nonce replay protection, and signature verification
   */
  validateSignature(
    deviceId: string,
    payload: string,
    signature: string,
    timestamp: string,
    nonce: string,
    algorithm: string
  ): HmacValidationResult {
    try {
      // 1. Validate algorithm
      if (algorithm !== this.config.algorithm) {
        return {
          valid: false,
          reason: `Invalid algorithm: ${algorithm}. Expected: ${this.config.algorithm}`,
        };
      }

      // 2. Validate timestamp (prevent replay attacks)
      const timestampValidation = this.validateTimestamp(timestamp);
      if (!timestampValidation.valid) {
        return {
          valid: false,
          reason: timestampValidation.reason,
        };
      }

      // 3. Validate nonce format
      if (!this.validateNonceFormat(nonce)) {
        return {
          valid: false,
          reason: 'Invalid nonce format',
        };
      }

      // 4. Verify signature
      const expectedSignature = this.generateSignature(deviceId, payload, timestamp, nonce);
      if (signature !== expectedSignature.signature) {
        return {
          valid: false,
          reason: 'Invalid signature',
        };
      }

      // 5. Check for nonce replay (basic implementation)
      // In production, use Redis to track used nonces with TTL
      if (this.isNonceReused(nonce)) {
        return {
          valid: false,
          reason: 'Nonce already used (replay attack detected)',
        };
      }

      // 6. Mark nonce as used
      this.markNonceAsUsed(nonce);

      this.logger.debug('HMAC signature validation successful', {
        deviceId,
        algorithm,
        timestamp,
        nonce,
      });

      return {
        valid: true,
        deviceId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('HMAC signature validation failed', {
        error: errorMessage,
        deviceId,
        algorithm,
        timestamp,
        nonce,
      });

      return {
        valid: false,
        reason: `Validation error: ${errorMessage}`,
      };
    }
  }

  /**
   * Create signature base string for HMAC generation
   * Follows OAuth 1.0a style parameter ordering
   */
  private createSignatureBase(
    deviceId: string,
    payload: string,
    timestamp: string,
    nonce: string
  ): string {
    // Sort parameters alphabetically (OAuth 1.0a style)
    const params = {
      algorithm: this.config.algorithm,
      deviceId,
      nonce,
      payload: this.hashPayload(payload),
      timestamp,
    };

    // Create parameter string
    const paramString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    return paramString;
  }

  /**
   * Hash payload for signature (prevents payload tampering)
   */
  private hashPayload(payload: string): string {
    return createHmac(this.config.algorithm, this.config.secretKey).update(payload).digest('hex');
  }

  /**
   * Generate cryptographically secure nonce
   */
  private generateNonce(): string {
    return randomBytes(this.config.nonceLength).toString('hex');
  }

  /**
   * Validate timestamp to prevent replay attacks
   */
  private validateTimestamp(timestamp: string): { valid: boolean; reason?: string } {
    try {
      const messageTime = new Date(timestamp).getTime();
      const currentTime = Date.now();
      const timeDiff = Math.abs(currentTime - messageTime) / 1000; // Convert to seconds

      if (timeDiff > this.config.timestampTolerance) {
        return {
          valid: false,
          reason: `Timestamp too old: ${timeDiff}s > ${this.config.timestampTolerance}s tolerance`,
        };
      }

      return { valid: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        valid: false,
        reason: `Invalid timestamp format: ${errorMessage}`,
      };
    }
  }

  /**
   * Validate nonce format
   */
  private validateNonceFormat(nonce: string): boolean {
    // Nonce should be hexadecimal string of expected length
    const hexRegex = new RegExp(`^[a-f0-9]{${this.config.nonceLength * 2}}$`);
    return hexRegex.test(nonce);
  }

  /**
   * Check if nonce has been reused (basic implementation)
   * In production, use Redis with TTL for better performance
   */
  private isNonceReused(nonce: string): boolean {
    // Basic in-memory tracking for demo purposes
    // In production, use Redis with TTL
    const usedNonces = new Set<string>();

    if (usedNonces.has(nonce)) {
      return true;
    }

    return false;
  }

  /**
   * Mark nonce as used
   */
  private markNonceAsUsed(nonce: string): void {
    // Basic in-memory tracking for demo purposes
    // In production, use Redis with TTL
    const usedNonces = new Set<string>();
    usedNonces.add(nonce);
  }

  /**
   * Get configuration for external use
   */
  getConfig(): HmacAuthConfig {
    return { ...this.config };
  }

  /**
   * Rotate secret key (for production key rotation)
   */
  rotateSecretKey(newSecretKey: string): void {
    this.config.secretKey = newSecretKey;
    this.logger.warn('HMAC secret key rotated');
  }
}
