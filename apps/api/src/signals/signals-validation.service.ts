import { Injectable, BadRequestException } from '@nestjs/common';
import { XRaySignalsPayload } from '@iotp/shared-types';
import { SignalQuery } from './types';

@Injectable()
export class SignalsValidationService {
  /**
   * Validates coordinate ranges
   */
  validateCoordinates(lat: number, lon: number): boolean {
    // Latitude: -90 to 90
    if (lat < -90 || lat > 90) {
      throw new BadRequestException(`Invalid latitude: ${lat}. Must be between -90 and 90.`);
    }

    // Longitude: -180 to 180
    if (lon < -180 || lon > 180) {
      throw new BadRequestException(`Invalid longitude: ${lon}. Must be between -180 and 180.`);
    }

    return true;
  }

  /**
   * Validates timestamp
   */
  validateTimestamp(timestamp: number): boolean {
    const now = Date.now();
    const minTimestamp = 0; // Unix epoch start
    const maxTimestamp = now + 365 * 24 * 60 * 60 * 1000; // 1 year in future

    if (timestamp < minTimestamp || timestamp > maxTimestamp) {
      throw new BadRequestException(
        `Invalid timestamp: ${timestamp}. Must be between ${minTimestamp} and ${maxTimestamp}.`
      );
    }

    return true;
  }

  /**
   * Validates data format
   */
  validateDataFormat(data: Array<[number, [number, number, number]]>): boolean {
    if (!Array.isArray(data) || data.length === 0) {
      throw new BadRequestException('Data must be a non-empty array.');
    }

    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      if (!Array.isArray(item) || item.length !== 2) {
        throw new BadRequestException(
          `Data item ${i} must be an array with 2 elements: [timestamp, [lat, lon, speed]]`
        );
      }

      const [timestamp, coordinates] = item;

      // Validate timestamp
      if (typeof timestamp !== 'number' || timestamp < 0) {
        throw new BadRequestException(`Invalid timestamp at index ${i}: ${timestamp}`);
      }

      // Validate coordinates
      if (!Array.isArray(coordinates) || coordinates.length !== 3) {
        throw new BadRequestException(
          `Invalid coordinates at index ${i}. Expected [lat, lon, speed], got: ${String(coordinates)}`
        );
      }

      const [lat, lon, speed] = coordinates;

      // Validate coordinate types
      if (typeof lat !== 'number' || typeof lon !== 'number' || typeof speed !== 'number') {
        throw new BadRequestException(
          `Invalid coordinate types at index ${i}. Expected numbers, got: lat=${typeof lat}, lon=${typeof lon}, speed=${typeof speed}`
        );
      }

      // Validate coordinate ranges
      this.validateCoordinates(lat, lon);

      // Validate speed (reasonable range: 0 to 1000 km/h)
      if (speed < 0 || speed > 1000) {
        throw new BadRequestException(
          `Invalid speed at index ${i}: ${speed}. Must be between 0 and 1000.`
        );
      }
    }

    return true;
  }

  /**
   * Validates device ID format
   */
  validateDeviceId(deviceId: string): boolean {
    if (!deviceId || typeof deviceId !== 'string') {
      throw new BadRequestException('Device ID must be a non-empty string.');
    }

    if (deviceId.length < 3 || deviceId.length > 50) {
      throw new BadRequestException(
        `Device ID length must be between 3 and 50 characters. Got: ${deviceId.length}`
      );
    }

    // Allow alphanumeric, hyphens, and underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(deviceId)) {
      throw new BadRequestException(
        `Device ID contains invalid characters. Only alphanumeric, hyphens, and underscores are allowed. Got: ${deviceId}`
      );
    }

    return true;
  }

  /**
   * Comprehensive validation of signal data
   */
  validateSignalData(createSignalDto: XRaySignalsPayload): boolean {
    try {
      // Validate device ID
      this.validateDeviceId(createSignalDto.deviceId);

      // Validate timestamp
      this.validateTimestamp(createSignalDto.time);

      // Validate data format
      this.validateDataFormat(createSignalDto.data);

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      throw new BadRequestException(`Signal validation failed: ${errorMessage}`);
    }
  }

  /**
   * Validates query parameters
   */
  validateQueryParams(query: SignalQuery): boolean {
    // Handle null/undefined
    if (!query) {
      return true;
    }

    // Validate time range
    if (query.from && query.to) {
      const fromDate = new Date(query.from);
      const toDate = new Date(query.to);

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        throw new BadRequestException(
          'Invalid date format for from/to parameters. Use ISO8601 format.'
        );
      }

      if (fromDate >= toDate) {
        throw new BadRequestException('From date must be before to date.');
      }
    }

    // Validate numeric ranges
    if (query.minDataLength && query.maxDataLength) {
      if (query.minDataLength > query.maxDataLength) {
        throw new BadRequestException('minDataLength must be less than or equal to maxDataLength.');
      }
    }

    if (query.minDataVolume && query.maxDataVolume) {
      if (query.minDataVolume > query.maxDataVolume) {
        throw new BadRequestException('minDataVolume must be less than or equal to maxDataVolume.');
      }
    }

    // Validate coordinate ranges
    if (query.minLat && query.maxLat) {
      if (query.minLat > query.maxLat) {
        throw new BadRequestException('minLat must be less than or equal to maxLat.');
      }
    }

    if (query.minLon && query.maxLon) {
      if (query.minLon > query.maxLon) {
        throw new BadRequestException('minLon must be less than or equal to maxLon.');
      }
    }

    return true;
  }
}
