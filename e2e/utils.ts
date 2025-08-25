import { PaginatedSignals, SignalDto } from '@iotp/shared-types';

// Types for test data - matching the actual format used in tests
export interface TestDataPoint {
  0: number; // timestamp
  1: [number, number, number]; // [lat, lon, altitude]
}

export interface TestDeviceData {
  data: TestDataPoint[];
  time: number;
}

export interface TestMessage {
  [deviceId: string]: TestDeviceData;
}

// Test data generators
export const createTestData = (
  deviceId: string,
  dataPoints: TestDataPoint[],
  time?: number
): TestMessage => ({
  [deviceId]: {
    data: dataPoints,
    time: time || Date.now(),
  },
});

export const createSimpleTestData = (
  deviceId: string,
  count: number = 2,
  baseLat: number = 51.5,
  baseLon: number = 12.5
): TestMessage => {
  const dataPoints: TestDataPoint[] = Array.from(
    { length: count },
    (_, index) =>
      [
        1000 + index * 1000,
        [baseLat + index * 0.001, baseLon + index * 0.001, 1.0 + index * 0.5],
      ] as TestDataPoint
  );

  return createTestData(deviceId, dataPoints);
};

export const createCoordinateTestData = (
  deviceId: string,
  coordinates: Array<[number, number, number]>,
  time?: number
): TestMessage => {
  const dataPoints: TestDataPoint[] = coordinates.map(
    (coord, index) => [1000 + index * 1000, coord] as TestDataPoint
  );

  return createTestData(deviceId, dataPoints, time);
};

// Producer interaction utilities
export const sendTestMessage = async (
  producerUrl: string,
  testData: TestMessage
): Promise<globalThis.Response> => {
  return fetch(`${producerUrl}/test/publish/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testData),
  });
};

export const sendSampleMessage = async (producerUrl: string): Promise<globalThis.Response> => {
  return fetch(`${producerUrl}/test/publish/sample`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
};

// API interaction utilities
export const fetchSignals = async (
  apiUrl: string,
  queryParams?: Record<string, string | number>
): Promise<PaginatedSignals> => {
  const url = new globalThis.URL(`${apiUrl}/api/signals`);

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<PaginatedSignals>;
};

export const fetchSignalById = async (apiUrl: string, signalId: string): Promise<SignalDto> => {
  const response = await fetch(`${apiUrl}/api/signals/${signalId}`);
  if (!response.ok) {
    throw new Error(`Signal fetch failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<SignalDto>;
};

export const fetchRawMetadata = async (
  apiUrl: string,
  signalId: string
): Promise<{ filename: string; size?: number; length?: number }> => {
  const response = await fetch(`${apiUrl}/api/signals/${signalId}/raw/metadata`);
  if (!response.ok) {
    throw new Error(`Raw metadata fetch failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<{ filename: string; size?: number; length?: number }>;
};

export const fetchRawData = async (
  apiUrl: string,
  signalId: string
): Promise<globalThis.Response> => {
  const response = await fetch(`${apiUrl}/api/signals/${signalId}/raw`);
  if (!response.ok) {
    throw new Error(`Raw data fetch failed: ${response.status} ${response.statusText}`);
  }

  return response;
};

export const checkApiHealth = async (apiUrl: string): Promise<{ status: string }> => {
  const response = await fetch(`${apiUrl}/api/health`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<{ status: string }>;
};

export const checkProducerHealth = async (producerUrl: string): Promise<globalThis.Response> => {
  return fetch(`${producerUrl}/test/health`);
};

// Wait utilities
export const waitForSignal = async (
  apiUrl: string,
  deviceId: string,
  timeout: number = 30000
): Promise<void> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const signals = await fetchSignals(apiUrl);
      if (signals.items.some(s => s.deviceId === deviceId)) {
        return;
      }
    } catch {
      // Continue waiting
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error(`Signal for device ${deviceId} not found within ${timeout}ms`);
};

export const waitForSignalsCount = async (
  apiUrl: string,
  minCount: number,
  timeout: number = 30000
): Promise<void> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const signals = await fetchSignals(apiUrl);
      if (signals.items.length >= minCount) {
        return;
      }
    } catch {
      // Continue waiting
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error(`Expected at least ${minCount} signals within ${timeout}ms`);
};

export const waitForSignalsWithLocation = async (
  apiUrl: string,
  timeout: number = 30000
): Promise<void> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const signals = await fetchSignals(apiUrl);
      if (signals.items.some(s => s.location)) {
        return;
      }
    } catch {
      // Continue waiting
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error(`Signals with location not found within ${timeout}ms`);
};

// Validation utilities
export const validateSignal = (
  signal: SignalDto,
  expectedDeviceId: string,
  expectedDataLength: number
): void => {
  expect(signal).toBeDefined();
  expect(signal.deviceId).toBe(expectedDeviceId);
  expect(signal.dataLength).toBe(expectedDataLength);
  expect(signal.rawRef).toBeDefined();
};

export const validateSignalWithLocation = (
  signal: SignalDto,
  expectedDeviceId: string,
  expectedDataLength: number
): void => {
  validateSignal(signal, expectedDeviceId, expectedDataLength);
  expect(signal.location).toBeDefined();
};

// Performance testing utilities
export const measureResponseTime = async <T>(
  operation: () => Promise<T>
): Promise<{ result: T; responseTime: number }> => {
  const startTime = Date.now();
  const result = await operation();
  const responseTime = Date.now() - startTime;

  return { result, responseTime };
};

export const sendConcurrentMessages = async (
  producerUrl: string,
  messages: TestMessage[]
): Promise<globalThis.Response[]> => {
  const sendPromises = messages.map(message => sendTestMessage(producerUrl, message));
  return Promise.all(sendPromises);
};

export const createLoadTestMessages = (
  devicePrefix: string,
  count: number,
  baseLat: number = 51.0,
  baseLon: number = 12.0
): TestMessage[] => {
  return Array.from({ length: count }, (_, index) => ({
    [`${devicePrefix}-${index.toString().padStart(3, '0')}`]: {
      data: [
        [1000 + index, [baseLat + index * 0.001, baseLon + index * 0.001, 1.0]] as TestDataPoint,
      ],
      time: Date.now() + index * 1000,
    },
  }));
};

// Common test data
export const COMMON_TEST_COORDINATES = {
  GERMANY: [51.339764, 12.339223833333334, 1.2038000000000002] as [number, number, number],
  GERMANY_2: [51.33977733333333, 12.339211833333334, 1.531604] as [number, number, number],
  GERMANY_3: [51.339782, 12.339196166666667, 2.13906] as [number, number, number],
};

export const COMMON_TEST_DEVICES = {
  DEVICE_001: 'test-device-001',
  DEVICE_002: 'test-device-002',
  DEVICE_003: 'test-device-003',
  DEVICE_004: 'test-device-004',
  IDEMPOTENCY_TEST: '66bb584d4ae73e488c30a072',
  SORT_TEST: 'test-device-sort',
  PAGINATE_TEST: 'test-device-paginate',
  THROUGHPUT_PREFIX: 'test-device-throughput',
  CONCURRENT_PREFIX: 'concurrent-device',
  AVAILABILITY_PREFIX: 'test-device-availability',
  SUSTAINED_PREFIX: 'test-device-sustained',
  INVALID_COORDS: 'test-device-invalid',
  MISSING_FIELDS: 'test-device-missing',
  EMPTY_DATA: 'test-device-empty',
  BOUNDARY_COORDS: 'test-device-boundary',
} as const;
