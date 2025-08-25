import { Injectable } from '@nestjs/common';
import { DataPoint } from '@iotp/shared-types';
import { TestFormat } from './producer.types';

@Injectable()
export class TestDataGeneratorService {
  // Original format from task description
  generateOriginalFormat(): Record<string, { data: DataPoint[]; time: number }> {
    return {
      '66bb584d4ae73e488c30a072': {
        data: [
          { timestamp: 762, lat: 51.339764, lon: 12.339223833333334, speed: 1.2038000000000002 },
          { timestamp: 1766, lat: 51.33977733333333, lon: 12.339211833333334, speed: 1.531604 },
          { timestamp: 2763, lat: 51.339782, lon: 12.339196166666667, speed: 2.13906 },
        ],
        time: 1735683480000,
      },
    };
  }

  // Different device ID format
  generateDifferentDeviceFormat(): Record<string, { data: DataPoint[]; time: number }> {
    return {
      'iot-device-xyz-123': {
        data: [
          { timestamp: 100, lat: 40.7128, lon: -74.006, speed: 0.5 }, // NYC coordinates
          { timestamp: 200, lat: 40.713, lon: -74.0058, speed: 0.8 },
          { timestamp: 300, lat: 40.7132, lon: -74.0056, speed: 1.2 },
        ],
        time: Date.now(),
      },
    };
  }

  // Multiple data points
  generateMultipleDataPoints(): Record<string, { data: DataPoint[]; time: number }> {
    return {
      'sensor-array-001': {
        data: [
          { timestamp: 100, lat: 37.7749, lon: -122.4194, speed: 0.0 }, // San Francisco
          { timestamp: 200, lat: 37.7751, lon: -122.4192, speed: 0.3 },
          { timestamp: 300, lat: 37.7753, lon: -122.419, speed: 0.6 },
          { timestamp: 400, lat: 37.7755, lon: -122.4188, speed: 0.9 },
          { timestamp: 500, lat: 37.7757, lon: -122.4186, speed: 1.2 },
          { timestamp: 600, lat: 37.7759, lon: -122.4184, speed: 1.5 },
        ],
        time: Date.now(),
      },
    };
  }

  // Single data point
  generateSingleDataPoint(): Record<string, { data: DataPoint[]; time: number }> {
    return {
      'single-sensor': {
        data: [
          { timestamp: 100, lat: 51.5074, lon: -0.1278, speed: 0.0 }, // London
        ],
        time: Date.now(),
      },
    };
  }

  // High precision coordinates
  generateHighPrecisionData(): Record<string, { data: DataPoint[]; time: number }> {
    return {
      'precision-sensor': {
        data: [
          { timestamp: 100, lat: 51.50735123456789, lon: -0.1277587654321, speed: 1.234567890123456 },
          { timestamp: 200, lat: 51.5073523456789, lon: -0.12775765432109, speed: 2.345678901234567 },
          { timestamp: 300, lat: 51.50735345678901, lon: -0.12775654321098, speed: 3.456789012345678 },
        ],
        time: Date.now(),
      },
    };
  }

  // Edge case: very small values
  generateEdgeCaseSmallValues(): Record<string, { data: DataPoint[]; time: number }> {
    return {
      'edge-sensor': {
        data: [
          { timestamp: 100, lat: 0.000001, lon: 0.000001, speed: 0.000001 },
          { timestamp: 200, lat: -0.000001, lon: -0.000001, speed: 0.000001 },
          { timestamp: 300, lat: 0.000001, lon: -0.000001, speed: 0.000001 },
        ],
        time: Date.now(),
      },
    };
  }

  // Edge case: very large values
  generateEdgeCaseLargeValues(): Record<string, { data: DataPoint[]; time: number }> {
    return {
      'large-sensor': {
        data: [
          { timestamp: 100, lat: 89.999999, lon: 179.999999, speed: 999.999999 },
          { timestamp: 200, lat: -89.999999, lon: -179.999999, speed: 999.999999 },
          { timestamp: 300, lat: 89.999999, lon: -179.999999, speed: 999.999999 },
        ],
        time: Date.now(),
      },
    };
  }

  // Different timestamp formats
  generateDifferentTimestampFormats(): Record<string, { data: DataPoint[]; time: number }> {
    const now = Date.now();
    return {
      'timestamp-test': {
        data: [
          { timestamp: 100, lat: 51.5074, lon: -0.1278, speed: 1.0 },
          { timestamp: 200, lat: 51.5075, lon: -0.1279, speed: 2.0 },
          { timestamp: 300, lat: 51.5076, lon: -0.128, speed: 3.0 },
        ],
        time: now, // Current timestamp
      },
    };
  }

  // Generate all test formats
  generateAllTestFormats(): TestFormat[] {
    return [
      { name: 'Original Format', data: this.generateOriginalFormat() },
      { name: 'Different Device Format', data: this.generateDifferentDeviceFormat() },
      { name: 'Multiple Data Points', data: this.generateMultipleDataPoints() },
      { name: 'Single Data Point', data: this.generateSingleDataPoint() },
      { name: 'High Precision Data', data: this.generateHighPrecisionData() },
      { name: 'Edge Case Small Values', data: this.generateEdgeCaseSmallValues() },
      { name: 'Edge Case Large Values', data: this.generateEdgeCaseLargeValues() },
      { name: 'Different Timestamp Format', data: this.generateDifferentTimestampFormats() },
    ];
  }

  // Generate random test data
  generateRandomTestData(): Record<string, { data: DataPoint[]; time: number }> {
    const deviceId = `random-device-${Math.random().toString(36).substr(2, 9)}`;
    const dataPoints = Math.floor(Math.random() * 10) + 1; // 1-10 data points
    const data: DataPoint[] = [];

    for (let i = 0; i < dataPoints; i++) {
      const lat = (Math.random() - 0.5) * 180; // -90 to 90
      const lon = (Math.random() - 0.5) * 360; // -180 to 180
      const speed = Math.random() * 100; // 0 to 100
      const timestamp = Math.floor(Math.random() * 10000); // 0 to 10000

      data.push({ timestamp, lat, lon, speed });
    }

    return {
      [deviceId]: {
        data,
        time: Date.now(),
      },
    };
  }
}
