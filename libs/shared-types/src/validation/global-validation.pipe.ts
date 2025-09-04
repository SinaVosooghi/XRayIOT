/**
 * Global Validation Pipe Configuration
 *
 * This file provides a centralized validation pipe configuration
 * that can be used across all services for consistent validation.
 */

import { ValidationPipe, ValidationPipeOptions } from '@nestjs/common';

export const GLOBAL_VALIDATION_OPTIONS: ValidationPipeOptions = {
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
  exceptionFactory: errors => {
    const formattedErrors = errors.map(error => ({
      property: error.property,
      value: error.value as unknown,
      constraints: error.constraints,
      children: error.children,
    }));

    return new Error(`Validation failed: ${JSON.stringify(formattedErrors)}`);
  },
};

export const createGlobalValidationPipe = (
  options?: Partial<ValidationPipeOptions>
): ValidationPipe => {
  return new ValidationPipe({
    ...GLOBAL_VALIDATION_OPTIONS,
    ...options,
  });
};
