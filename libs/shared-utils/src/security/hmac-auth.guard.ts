import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HmacAuthService } from './hmac-auth.service';
import { NonceTrackerService } from './nonce-tracker.service';
import { AuthenticatedRequest } from '../authenticated-request.interface';

export const HMAC_AUTH_KEY = 'hmac_auth';
export const HMAC_AUTH_OPTIONAL_KEY = 'hmac_auth_optional';

export interface HmacAuthOptions {
  required?: boolean;
  deviceIdHeader?: string;
  signatureHeader?: string;
  timestampHeader?: string;
  nonceHeader?: string;
  algorithmHeader?: string;
}

@Injectable()
export class HmacAuthGuard implements CanActivate {
  private readonly logger = new Logger(HmacAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly hmacAuthService: HmacAuthService,
    private readonly nonceTrackerService: NonceTrackerService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const hmacAuthOptions = this.reflector.getAllAndOverride<HmacAuthOptions>(HMAC_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const hmacAuthOptional = this.reflector.getAllAndOverride<boolean>(HMAC_AUTH_OPTIONAL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no HMAC auth is required, allow access
    if (!hmacAuthOptions && !hmacAuthOptional) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const headers = request.headers;

    // Default header names
    const options: Required<HmacAuthOptions> = {
      required: true,
      deviceIdHeader: 'x-device-id',
      signatureHeader: 'x-hmac-signature',
      timestampHeader: 'x-timestamp',
      nonceHeader: 'x-nonce',
      algorithmHeader: 'x-algorithm',
      ...hmacAuthOptions,
    };

    try {
      // Extract authentication headers with proper type checking
      const deviceId = this.getHeaderValue(headers, options.deviceIdHeader);
      const signature = this.getHeaderValue(headers, options.signatureHeader);
      const timestamp = this.getHeaderValue(headers, options.timestampHeader);
      const nonce = this.getHeaderValue(headers, options.nonceHeader);
      const algorithm = this.getHeaderValue(headers, options.algorithmHeader);

      // Check if all required headers are present
      if (!deviceId || !signature || !timestamp || !nonce || !algorithm) {
        if (options.required) {
          this.logger.warn('Missing HMAC authentication headers', {
            deviceId: !!deviceId,
            signature: !!signature,
            timestamp: !!timestamp,
            nonce: !!nonce,
            algorithm: !!algorithm,
            headers: Object.keys(headers),
          });
          throw new UnauthorizedException('Missing HMAC authentication headers');
        } else {
          // Optional auth - allow access without headers
          this.logger.debug('HMAC auth optional - allowing access without headers');
          return true;
        }
      }

      // Get request body for signature validation
      const payload = this.getRequestPayload(request);

      // Validate HMAC signature
      const validationResult = this.hmacAuthService.validateSignature(
        deviceId,
        payload,
        signature,
        timestamp,
        nonce,
        algorithm
      );

      if (!validationResult.valid) {
        this.logger.warn('HMAC signature validation failed', {
          deviceId,
          reason: validationResult.reason,
          ip: request.ip,
          userAgent: request.get('User-Agent'),
        });
        throw new UnauthorizedException(`HMAC validation failed: ${validationResult.reason}`);
      }

      // Check nonce replay protection
      const isNonceUsed = await this.nonceTrackerService.isNonceUsed(nonce, deviceId);
      if (isNonceUsed) {
        this.logger.warn('Nonce replay attack detected', {
          deviceId,
          nonce,
          ip: request.ip,
        });
        throw new UnauthorizedException('Nonce replay attack detected');
      }

      // Add device ID to request for downstream use
      request.deviceId = deviceId;
      request.hmacValidated = true;

      this.logger.debug('HMAC authentication successful', {
        deviceId,
        algorithm,
        timestamp,
        nonce,
        ip: request.ip,
      });

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error('HMAC authentication error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private getHeaderValue(
    headers: Record<string, string | string[] | undefined>,
    headerName: string
  ): string | undefined {
    const value = headers[headerName];
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }

  /**
   * Extract request payload for signature validation
   */
  private getRequestPayload(request: AuthenticatedRequest): string {
    // Handle different content types
    if (request.body) {
      if (typeof request.body === 'string') {
        return request.body;
      }
      if (typeof request.body === 'object') {
        return JSON.stringify(request.body);
      }
    }

    // Handle raw body
    if (request.rawBody) {
      return request.rawBody.toString();
    }

    // Handle query parameters
    if (request.query && Object.keys(request.query).length > 0) {
      return JSON.stringify(request.query);
    }

    // Default to empty string if no payload
    return '';
  }
}

/**
 * Decorator to require HMAC authentication
 */
export const RequireHmacAuth = (options?: HmacAuthOptions) => {
  return (target: unknown, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(
      HMAC_AUTH_KEY,
      { required: true, ...options },
      (descriptor?.value || target) as object
    );
    return descriptor;
  };
};

/**
 * Decorator to make HMAC authentication optional
 */
export const OptionalHmacAuth = (options?: HmacAuthOptions) => {
  return (target: unknown, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(HMAC_AUTH_OPTIONAL_KEY, true, (descriptor?.value || target) as object);
    Reflect.defineMetadata(
      HMAC_AUTH_KEY,
      { required: false, ...options },
      (descriptor?.value || target) as object
    );
    return descriptor;
  };
};
