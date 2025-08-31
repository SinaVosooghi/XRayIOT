import { Injectable } from '@nestjs/common';
import { XRayRawSignal, XRayProcessedSignal, DeviceStatusUpdate } from '@iotp/shared-messaging';

@Injectable()
export class TestDataGeneratorService {
  /**
   * Generate a valid XRay raw signal for testing
   */
  generateRawSignal(deviceId?: string): XRayRawSignal {
    return {
      deviceId: deviceId || `device_${Math.floor(Math.random() * 1000)}`,
      capturedAt: new Date().toISOString(),
      payload: Buffer.from(
        JSON.stringify({
          temperature: 20 + Math.random() * 10,
          humidity: 40 + Math.random() * 20,
          pressure: 1013 + Math.random() * 10,
        })
      ).toString('base64'),
      schemaVersion: 'v1',
      metadata: {
        location: {
          latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
          longitude: -74.006 + (Math.random() - 0.5) * 0.1,
          altitude: 10 + Math.random() * 100,
        },
        battery: 20 + Math.random() * 80,
        signalStrength: -60 - Math.random() * 40,
      },
    };
  }

  /**
   * Generate a valid XRay processed signal for testing
   */
  generateProcessedSignal(deviceId?: string): XRayProcessedSignal {
    const rawSignal = this.generateRawSignal(deviceId);

    return {
      deviceId: rawSignal.deviceId,
      processedAt: new Date().toISOString(),
      originalPayload: rawSignal.payload,
      processedData: {
        readings: [
          {
            type: 'temperature',
            value: 20 + Math.random() * 10,
            unit: 'celsius',
            confidence: 0.8 + Math.random() * 0.2,
          },
          {
            type: 'humidity',
            value: 40 + Math.random() * 20,
            unit: 'percent',
            confidence: 0.7 + Math.random() * 0.3,
          },
          {
            type: 'pressure',
            value: 1013 + Math.random() * 10,
            unit: 'hPa',
            confidence: 0.9 + Math.random() * 0.1,
          },
        ],
        anomalies:
          Math.random() > 0.8
            ? [
                {
                  type: 'temperature_spike',
                  severity: 'low' as const,
                  description: 'Temperature reading above normal range',
                },
              ]
            : [],
      },
      schemaVersion: 'v1',
    };
  }

  /**
   * Generate a valid device status update for testing
   */
  generateDeviceStatus(deviceId?: string): DeviceStatusUpdate {
    const statuses: Array<DeviceStatusUpdate['status']> = [
      'online',
      'offline',
      'error',
      'maintenance',
      'low_battery',
    ];

    return {
      deviceId: deviceId || `device_${Math.floor(Math.random() * 1000)}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      lastSeen: new Date().toISOString(),
      health: {
        battery: Math.random() * 100,
        signalStrength: -60 - Math.random() * 60,
        temperature: 15 + Math.random() * 30,
        uptime: Math.random() * 86400, // 0-24 hours in seconds
      },
    };
  }

  /**
   * Generate multiple raw signals for batch testing
   */
  generateRawSignals(count: number, deviceId?: string): XRayRawSignal[] {
    return Array.from({ length: count }, () => this.generateRawSignal(deviceId));
  }

  /**
   * Generate multiple processed signals for batch testing
   */
  generateProcessedSignals(count: number, deviceId?: string): XRayProcessedSignal[] {
    return Array.from({ length: count }, () => this.generateProcessedSignal(deviceId));
  }

  /**
   * Generate multiple device status updates for batch testing
   */
  generateDeviceStatuses(count: number, deviceId?: string): DeviceStatusUpdate[] {
    return Array.from({ length: count }, () => this.generateDeviceStatus(deviceId));
  }

  /**
   * Generate invalid data for testing validation
   */
  generateInvalidRawSignal(): any {
    return {
      // Missing required fields
      deviceId: '', // Empty string (invalid)
      // capturedAt missing
      payload: 'a'.repeat(1048577), // Exceeds 1MB limit
      schemaVersion: 'v3', // Invalid version
      metadata: {
        location: {
          latitude: 200, // Invalid latitude
          longitude: 200, // Invalid longitude
        },
        battery: 150, // Invalid battery level
        signalStrength: 50, // Invalid signal strength
      },
    };
  }

  /**
   * Generate edge case data for testing validation
   */
  generateEdgeCaseRawSignal(): XRayRawSignal {
    return {
      deviceId: 'a', // Minimum length
      capturedAt: new Date().toISOString(),
      payload: 'a', // Minimum length
      schemaVersion: 'v1',
      metadata: {
        location: {
          latitude: -90, // Edge case
          longitude: -180, // Edge case
          altitude: 0,
        },
        battery: 0, // Edge case
        signalStrength: -120, // Edge case
      },
    };
  }
}
