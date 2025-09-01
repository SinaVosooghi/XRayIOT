import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { schemas } from '../schemas/xray.schema';

// Initialize Ajv with formats support
const ajv = new Ajv({
  allErrors: true,
  verbose: true,
  strict: false,
  useDefaults: true,
  coerceTypes: true,
});

// Add format validators (date-time, uuid, etc.)
addFormats(ajv);

// Compile validation functions for all schemas
const validators: Record<string, ValidateFunction> = {};

Object.entries(schemas).forEach(([key, schema]) => {
  validators[key] = ajv.compile(schema);
});

export class MessageValidator {
  /**
   * Validate a message against a specific schema
   */
  static validate<T = Record<string, unknown>>(
    schemaKey: string,
    data: T
  ): { valid: boolean; errors?: string[] } {
    const validator = validators[schemaKey];

    if (!validator) {
      return {
        valid: false,
        errors: [`Schema '${schemaKey}' not found`],
      };
    }

    const valid = validator(data);

    if (!valid) {
      const errors =
        validator.errors?.map(error => `${error.instancePath} ${error.message}`.trim()) || [];

      return { valid: false, errors };
    }

    return { valid: true };
  }

  /**
   * Validate XRay raw signal
   */
  static validateRawSignal(data: Record<string, unknown>): { valid: boolean; errors?: string[] } {
    return this.validate('xray.raw.v1', data);
  }

  /**
   * Validate XRay processed signal
   */
  static validateProcessedSignal(data: Record<string, unknown>): {
    valid: boolean;
    errors?: string[];
  } {
    return this.validate('xray.processed.v1', data);
  }

  /**
   * Validate device status update
   */
  static validateDeviceStatus(data: Record<string, unknown>): {
    valid: boolean;
    errors?: string[];
  } {
    return this.validate('device.status.v1', data);
  }

  /**
   * Get all available schema keys
   */
  static getAvailableSchemas(): string[] {
    return Object.keys(schemas);
  }

  /**
   * Check if a schema exists
   */
  static hasSchema(schemaKey: string): boolean {
    return schemaKey in schemas;
  }

  /**
   * Get schema by key
   */
  static getSchema(schemaKey: string) {
    return schemas[schemaKey as keyof typeof schemas];
  }
}

export { ajv };
