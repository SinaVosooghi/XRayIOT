import { Injectable } from '@nestjs/common';
import { XRayDataTuple } from '@iotp/shared-types';
import { TestFormat } from './producer.types';

@Injectable()
export class TestDataGeneratorService {
  // Original format from task description
  generateOriginalFormat(): Record<string, { data: XRayDataTuple[]; time: number }> {
    return {
      '66bb584d4ae73e488c30a072': {
        data: [
          [762, [51.339764, 12.339223833333334, 1.2038000000000002]],
          [1766, [51.33977733333333, 12.339211833333334, 1.531604]],
          [2763, [51.339782, 12.339196166666667, 2.13906]],
        ] as XRayDataTuple[],
        time: 1735683480000,
      },
    };
  }

  // Different device ID format
  generateDifferentDeviceFormat(): Record<string, { data: XRayDataTuple[]; time: number }> {
    return {
      'iot-device-xyz-123': {
        data: [
          [100, [40.7128, -74.006, 0.5]], // NYC coordinates
          [200, [40.713, -74.0058, 0.8]],
          [300, [40.7132, -74.0056, 1.2]],
        ] as XRayDataTuple[],
        time: Date.now(),
      },
    };
  }

  // Multiple data points
  generateMultipleDataPoints(): Record<string, { data: XRayDataTuple[]; time: number }> {
    return {
      'sensor-array-001': {
        data: [
          [100, [37.7749, -122.4194, 0.0]], // San Francisco
          [200, [37.7751, -122.4192, 0.3]],
          [300, [37.7753, -122.419, 0.6]],
          [400, [37.7755, -122.4188, 0.9]],
          [500, [37.7757, -122.4186, 1.2]],
          [600, [37.7759, -122.4184, 1.5]],
        ] as XRayDataTuple[],
        time: Date.now(),
      },
    };
  }

  // Single data point
  generateSingleDataPoint(): Record<string, { data: XRayDataTuple[]; time: number }> {
    return {
      'single-sensor': {
        data: [
          [100, [51.5074, -0.1278, 0.0]], // London
        ] as XRayDataTuple[],
        time: Date.now(),
      },
    };
  }

  // High precision coordinates
  generateHighPrecisionData(): Record<string, { data: XRayDataTuple[]; time: number }> {
    return {
      'precision-sensor': {
        data: [
          [100, [51.50735123456789, -0.1277587654321, 1.234567890123456]],
          [200, [51.5073523456789, -0.12775765432109, 2.345678901234567]],
          [300, [51.50735345678901, -0.12775654321098, 3.456789012345678]],
        ] as XRayDataTuple[],
        time: Date.now(),
      },
    };
  }

  // Edge case: very small values
  generateEdgeCaseSmallValues(): Record<string, { data: XRayDataTuple[]; time: number }> {
    return {
      'edge-sensor': {
        data: [
          [100, [0.000001, 0.000001, 0.000001]],
          [200, [-0.000001, -0.000001, 0.000001]],
          [300, [0.000001, -0.000001, 0.000001]],
        ] as XRayDataTuple[],
        time: Date.now(),
      },
    };
  }

  // Edge case: very large values
  generateEdgeCaseLargeValues(): Record<string, { data: XRayDataTuple[]; time: number }> {
    return {
      'large-sensor': {
        data: [
          [100, [89.999999, 179.999999, 999.999999]],
          [200, [-89.999999, -179.999999, 999.999999]],
          [300, [89.999999, -179.999999, 999.999999]],
        ] as XRayDataTuple[],
        time: Date.now(),
      },
    };
  }

  // Different timestamp formats
  generateDifferentTimestampFormats(): Record<string, { data: XRayDataTuple[]; time: number }> {
    const now = Date.now();
    return {
      'timestamp-test': {
        data: [
          [100, [51.5074, -0.1278, 1.0]],
          [200, [51.5075, -0.1279, 2.0]],
          [300, [51.5076, -0.128, 3.0]],
        ] as XRayDataTuple[],
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
  generateRandomTestData(): Record<string, { data: XRayDataTuple[]; time: number }> {
    const deviceId = `random-device-${Math.random().toString(36).substr(2, 9)}`;
    const dataPoints = Math.floor(Math.random() * 10) + 1; // 1-10 data points
    const data: XRayDataTuple[] = [];

    for (let i = 0; i < dataPoints; i++) {
      const lat = (Math.random() - 0.5) * 180; // -90 to 90
      const lon = (Math.random() - 0.5) * 360; // -180 to 180
      const speed = Math.random() * 100; // 0 to 100
      const timestamp = Math.floor(Math.random() * 10000); // 0 to 10000

      data.push([timestamp, [lat, lon, speed]]);
    }

    return {
      [deviceId]: {
        data,
        time: Date.now(),
      },
    };
  }
}
