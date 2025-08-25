import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SignalsValidationService } from './signals-validation.service';
import { DataPoint } from '@iotp/shared-types';

describe('SignalsValidationService', () => {
  let service: SignalsValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SignalsValidationService],
    }).compile();

    service = module.get<SignalsValidationService>(SignalsValidationService);
  });

  describe('validateCoordinates', () => {
    it('should validate valid coordinates', () => {
      // Valid coordinates
      expect(service.validateCoordinates(0, 0)).toBe(true);
      expect(service.validateCoordinates(90, 180)).toBe(true);
      expect(service.validateCoordinates(-90, -180)).toBe(true);
      expect(service.validateCoordinates(45.5, -120.3)).toBe(true);
    });

    it('should throw error for invalid latitude', () => {
      expect(() => service.validateCoordinates(91, 0)).toThrow(BadRequestException);
      expect(() => service.validateCoordinates(-91, 0)).toThrow(BadRequestException);
      expect(() => service.validateCoordinates(100, 0)).toThrow(BadRequestException);
    });

    it('should throw error for invalid longitude', () => {
      expect(() => service.validateCoordinates(0, 181)).toThrow(BadRequestException);
      expect(() => service.validateCoordinates(0, -181)).toThrow(BadRequestException);
      expect(() => service.validateCoordinates(0, 200)).toThrow(BadRequestException);
    });
  });

  describe('validateTimestamp', () => {
    it('should validate valid timestamps', () => {
      const now = Date.now();
      expect(service.validateTimestamp(now)).toBe(true);
      expect(service.validateTimestamp(0)).toBe(true); // Unix epoch
      expect(service.validateTimestamp(now - 86400000)).toBe(true); // 1 day ago
    });

    it('should throw error for invalid timestamps', () => {
      const now = Date.now();
      const oneYearFromNow = now + 366 * 24 * 60 * 60 * 1000; // More than 1 year

      expect(() => service.validateTimestamp(-1)).toThrow(BadRequestException);
      expect(() => service.validateTimestamp(oneYearFromNow)).toThrow(BadRequestException);
    });
  });

  describe('validateDataFormat', () => {
    it('should validate valid data format', () => {
      const validData: DataPoint[] = [
        { timestamp: 1000, lat: 51.339764, lon: 12.339223, speed: 1.2038 },
        { timestamp: 2000, lat: 51.339765, lon: 12.339224, speed: 2.0 },
        { timestamp: 3000, lat: 51.339766, lon: 12.339225, speed: 0.5 },
      ];

      expect(service.validateDataFormat(validData)).toBe(true);
    });

    it('should validate single data point', () => {
      const singleData: DataPoint[] = [
        { timestamp: 1000, lat: 51.339764, lon: 12.339223, speed: 1.2038 },
      ];
      expect(service.validateDataFormat(singleData)).toBe(true);
    });

    it('should throw error for empty data array', () => {
      expect(() => service.validateDataFormat([])).toThrow(BadRequestException);
    });

    it('should throw error for non-array data', () => {
      expect(() => service.validateDataFormat(null as unknown as DataPoint[])).toThrow(
        BadRequestException
      );
      expect(() => service.validateDataFormat('invalid' as unknown as DataPoint[])).toThrow(
        BadRequestException
      );
    });



    it('should throw error for invalid coordinate types', () => {
      // Test with data that has wrong structure (will cause runtime error)
      const invalidData = [
        { timestamp: 1000, lat: '51.339764' as unknown as number, lon: 12.339223, speed: 1.2038 }, // String lat
        { timestamp: 1000, lat: 51.339764, lon: '12.339223' as unknown as number, speed: 1.2038 }, // String lon
        { timestamp: 1000, lat: 51.339764, lon: 12.339223, speed: '1.2038' as unknown as number }, // String speed
      ];

      expect(() => service.validateDataFormat(invalidData)).toThrow(
        BadRequestException
      );
    });

    it('should throw error for invalid speed values', () => {
      const invalidData: DataPoint[] = [
        { timestamp: 1000, lat: 51.339764, lon: 12.339223, speed: -1 }, // Negative speed
        { timestamp: 1000, lat: 51.339764, lon: 12.339223, speed: 1001 }, // Speed > 1000
        { timestamp: 1000, lat: 51.339764, lon: 12.339223, speed: 1000.1 }, // Speed > 1000
      ];

      expect(() => service.validateDataFormat(invalidData)).toThrow(BadRequestException);
    });
  });

  describe('validateDeviceId', () => {
    it('should validate valid device IDs', () => {
      expect(service.validateDeviceId('device-001')).toBe(true);
      expect(service.validateDeviceId('DEVICE_123')).toBe(true);
      expect(service.validateDeviceId('test-device-001')).toBe(true);
      expect(service.validateDeviceId('abc')).toBe(true); // Minimum length
      expect(service.validateDeviceId('a'.repeat(50))).toBe(true); // Maximum length
    });

    it('should throw error for invalid device IDs', () => {
      expect(() => service.validateDeviceId('')).toThrow(BadRequestException);
      expect(() => service.validateDeviceId('ab')).toThrow(BadRequestException); // Too short
      expect(() => service.validateDeviceId('a'.repeat(51))).toThrow(BadRequestException); // Too long
      expect(() => service.validateDeviceId('device@001')).toThrow(BadRequestException); // Invalid character
      expect(() => service.validateDeviceId('device 001')).toThrow(BadRequestException); // Space not allowed
    });
  });

  describe('validateSignalData', () => {
    it('should validate valid signal data', () => {
      const validSignal = {
        deviceId: 'test-device-001',
        time: Date.now(),
        data: [{ timestamp: 1000, lat: 51.339764, lon: 12.339223, speed: 1.2038 }],
      };

      expect(service.validateSignalData(validSignal)).toBe(true);
    });

    it('should throw error for invalid signal data', () => {
      const invalidSignal = {
        deviceId: 'test-device-001',
        time: Date.now(),
        data: [{ timestamp: 1000, lat: 200, lon: 100, speed: 1.0 }], // Invalid coordinates
      };

      expect(() => service.validateSignalData(invalidSignal)).toThrow(BadRequestException);
    });

    it('should propagate validation errors', () => {
      const invalidSignal = {
        deviceId: '', // Invalid device ID
        time: Date.now(),
        data: [{ timestamp: 1000, lat: 51.339764, lon: 12.339223, speed: 1.2038 }],
      };

      expect(() => service.validateSignalData(invalidSignal)).toThrow(BadRequestException);
      expect(() => service.validateSignalData(invalidSignal)).toThrow(
        'Device ID must be a non-empty string'
      );
    });
  });

  describe('validateQueryParams', () => {
    it('should validate valid query parameters', () => {
      const validQuery = {
        from: '2025-01-01T00:00:00Z',
        to: '2025-01-02T00:00:00Z',
        minDataLength: 5,
        maxDataLength: 10,
        minLat: 50.0,
        maxLat: 52.0,
      };

      expect(service.validateQueryParams(validQuery)).toBe(true);
    });

    it('should validate time range correctly', () => {
      const validTimeRange = {
        from: '2025-01-01T00:00:00Z',
        to: '2025-01-02T00:00:00Z',
      };

      expect(service.validateQueryParams(validTimeRange)).toBe(true);
    });

    it('should throw error for invalid time range', () => {
      const invalidTimeRange = {
        from: '2025-01-02T00:00:00Z',
        to: '2025-01-01T00:00:00Z', // from > to
      };

      expect(() => service.validateQueryParams(invalidTimeRange)).toThrow(BadRequestException);
      expect(() => service.validateQueryParams(invalidTimeRange)).toThrow(
        'From date must be before to date'
      );
    });

    it('should throw error for invalid date format', () => {
      const invalidDate = {
        from: 'invalid-date',
        to: '2025-01-02T00:00:00Z',
      };

      expect(() => service.validateQueryParams(invalidDate)).toThrow(BadRequestException);
      expect(() => service.validateQueryParams(invalidDate)).toThrow('Invalid date format');
    });

    it('should validate numeric ranges correctly', () => {
      const validRanges = {
        minDataLength: 5,
        maxDataLength: 10,
        minDataVolume: 1000,
        maxDataVolume: 2000,
      };

      expect(service.validateQueryParams(validRanges)).toBe(true);
    });

    it('should throw error for invalid numeric ranges', () => {
      const invalidRanges = {
        minDataLength: 10,
        maxDataLength: 5, // min > max
      };

      expect(() => service.validateQueryParams(invalidRanges)).toThrow(BadRequestException);
      expect(() => service.validateQueryParams(invalidRanges)).toThrow(
        'minDataLength must be less than or equal to maxDataLength'
      );
    });

    it('should validate coordinate ranges correctly', () => {
      const validCoords = {
        minLat: 50.0,
        maxLat: 52.0,
        minLon: -120.0,
        maxLon: -118.0,
      };

      expect(service.validateQueryParams(validCoords)).toBe(true);
    });

    it('should throw error for invalid coordinate ranges', () => {
      const invalidCoords = {
        minLat: 52.0,
        maxLat: 50.0, // min > max
      };

      expect(() => service.validateQueryParams(invalidCoords)).toThrow(BadRequestException);
      expect(() => service.validateQueryParams(invalidCoords)).toThrow(
        'minLat must be less than or equal to maxLat'
      );
    });

    it('should handle empty query parameters', () => {
      expect(service.validateQueryParams({})).toBe(true);
      expect(service.validateQueryParams({})).toBe(true);
    });
  });
});
