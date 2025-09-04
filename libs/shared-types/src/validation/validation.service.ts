/**
 * Centralized Validation Service
 *
 * This service provides centralized validation logic that can be used
 * across all services to ensure consistent validation behavior.
 */

import { Injectable, BadRequestException, ValidationError } from '@nestjs/common';
import { validate, ValidationError as ClassValidatorError } from 'class-validator';
import { plainToClass, ClassConstructor } from 'class-transformer';

export interface ValidationResult<T = unknown> {
  valid: boolean;
  data?: T;
  errors?: ValidationError[];
  errorMessage?: string;
}

@Injectable()
export class ValidationService {
  /**
   * Validate data against a DTO class
   */
  async validateDto<T extends object>(
    dtoClass: ClassConstructor<T>,
    data: unknown,
    groups?: string[]
  ): Promise<ValidationResult<T>> {
    try {
      // Transform plain object to class instance
      const dto = plainToClass(dtoClass, data, {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      });

      // Validate the DTO
      const errors = await validate(dto, {
        groups,
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      if (errors.length > 0) {
        return {
          valid: false,
          errors: this.formatValidationErrors(errors),
          errorMessage: this.buildErrorMessage(errors),
        };
      }

      return {
        valid: true,
        data: dto,
      };
    } catch (error) {
      return {
        valid: false,
        errorMessage: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

  /**
   * Validate and transform data
   */
  async validateAndTransform<T extends object>(
    dtoClass: ClassConstructor<T>,
    data: unknown,
    groups?: string[]
  ): Promise<T> {
    const result = await this.validateDto(dtoClass, data, groups);

    if (!result.valid) {
      throw new BadRequestException(result.errorMessage || 'Validation failed');
    }

    return result.data!;
  }

  /**
   * Validate coordinates
   */
  validateCoordinates(latitude: number, longitude: number): boolean {
    if (latitude < -90 || latitude > 90) {
      throw new BadRequestException(`Invalid latitude: ${latitude}. Must be between -90 and 90.`);
    }

    if (longitude < -180 || longitude > 180) {
      throw new BadRequestException(
        `Invalid longitude: ${longitude}. Must be between -180 and 180.`
      );
    }

    return true;
  }

  /**
   * Validate timestamp
   */
  validateTimestamp(timestamp: number): boolean {
    const now = Date.now();
    const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
    const oneYearFromNow = now + 365 * 24 * 60 * 60 * 1000;

    if (timestamp < oneYearAgo) {
      throw new BadRequestException(
        `Timestamp ${timestamp} is too old. Must be within the last year.`
      );
    }

    if (timestamp > oneYearFromNow) {
      throw new BadRequestException(
        `Timestamp ${timestamp} is in the future. Must be within the next year.`
      );
    }

    return true;
  }

  /**
   * Validate device ID
   */
  validateDeviceId(deviceId: string): boolean {
    if (!deviceId || typeof deviceId !== 'string') {
      throw new BadRequestException('Device ID must be a non-empty string');
    }

    if (deviceId.length < 1 || deviceId.length > 100) {
      throw new BadRequestException('Device ID must be between 1 and 100 characters');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(deviceId)) {
      throw new BadRequestException(
        'Device ID must contain only alphanumeric characters, underscores, and hyphens'
      );
    }

    return true;
  }

  /**
   * Validate data points array
   */
  validateDataPoints(dataPoints: unknown[]): boolean {
    if (!Array.isArray(dataPoints)) {
      throw new BadRequestException('Data must be an array');
    }

    if (dataPoints.length === 0) {
      throw new BadRequestException('Data array cannot be empty');
    }

    for (let i = 0; i < dataPoints.length; i++) {
      const point = dataPoints[i];

      if (!point || typeof point !== 'object') {
        throw new BadRequestException(`Data point ${i} must be an object`);
      }

      const pointObj = point as Record<string, unknown>;

      // Validate required fields
      if (typeof pointObj.timestamp !== 'number' || pointObj.timestamp <= 0) {
        throw new BadRequestException(`Data point ${i} must have a valid timestamp`);
      }

      if (typeof pointObj.lat !== 'number') {
        throw new BadRequestException(`Data point ${i} must have a valid latitude`);
      }

      if (typeof pointObj.lon !== 'number') {
        throw new BadRequestException(`Data point ${i} must have a valid longitude`);
      }

      if (typeof pointObj.speed !== 'number' || pointObj.speed < 0) {
        throw new BadRequestException(`Data point ${i} must have a valid speed`);
      }

      // Validate coordinate ranges
      this.validateCoordinates(pointObj.lat, pointObj.lon);
    }

    return true;
  }

  /**
   * Validate pagination parameters
   */
  validatePagination(page?: number, limit?: number): boolean {
    if (page !== undefined) {
      if (!Number.isInteger(page) || page < 1 || page > 1000) {
        throw new BadRequestException('Page must be an integer between 1 and 1000');
      }
    }

    if (limit !== undefined) {
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new BadRequestException('Limit must be an integer between 1 and 100');
      }
    }

    return true;
  }

  /**
   * Validate time range
   */
  validateTimeRange(startTime?: string, endTime?: string): boolean {
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (isNaN(start.getTime())) {
        throw new BadRequestException('Invalid start time format');
      }

      if (isNaN(end.getTime())) {
        throw new BadRequestException('Invalid end time format');
      }

      if (start >= end) {
        throw new BadRequestException('Start time must be before end time');
      }
    }

    return true;
  }

  /**
   * Format validation errors for consistent error responses
   */
  private formatValidationErrors(errors: ClassValidatorError[]): ValidationError[] {
    return errors.map(error => ({
      property: error.property,
      value: error.value as unknown,
      constraints: error.constraints,
      children: error.children ? this.formatValidationErrors(error.children) : [],
    }));
  }

  /**
   * Build human-readable error message from validation errors
   */
  private buildErrorMessage(errors: ClassValidatorError[]): string {
    const messages: string[] = [];

    for (const error of errors) {
      if (error.constraints) {
        messages.push(...Object.values(error.constraints));
      }

      if (error.children && error.children.length > 0) {
        messages.push(...this.buildErrorMessage(error.children).split(', '));
      }
    }

    return messages.join(', ');
  }

  /**
   * Validate message contract
   */
  validateMessageContract(message: unknown): boolean {
    if (!message || typeof message !== 'object') {
      throw new BadRequestException('Message must be an object');
    }

    const requiredFields = [
      'schemaVersion',
      'idempotencyKey',
      'correlationId',
      'createdAt',
      'messageType',
    ];

    const messageObj = message as Record<string, unknown>;

    for (const field of requiredFields) {
      if (!messageObj[field]) {
        throw new BadRequestException(`Message must have ${field} field`);
      }
    }

    // Validate schema version format
    if (
      typeof messageObj.schemaVersion !== 'string' ||
      !/^v\d+\.\d+$/.test(messageObj.schemaVersion)
    ) {
      throw new BadRequestException('Schema version must be in format vX.Y');
    }

    // Validate message type
    const validTypes = ['xray.raw', 'xray.processed', 'device.status', 'error'];
    if (
      typeof messageObj.messageType !== 'string' ||
      !validTypes.includes(messageObj.messageType)
    ) {
      throw new BadRequestException(`Message type must be one of: ${validTypes.join(', ')}`);
    }

    return true;
  }
}
