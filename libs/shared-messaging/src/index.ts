import { DataPoint } from '@iotp/shared-types';

// Generic payload types for messaging
export interface GenericPayload {
  deviceId: string;
  data: DataPoint[];
  time: number;
}

export interface LegacyPayload {
  [deviceId: string]: {
    data: DataPoint[];
    time: number;
  };
}

export * from './rmq/topology';
export * from './schemas/xray.schema';
export * from './validators/ajv';

export function normalizeXRayPayload(input: LegacyPayload): GenericPayload {
  // If already normalized
  if (input && typeof input === 'object' && 'deviceId' in input && 'data' in input) {
    return input as unknown as GenericPayload;
  }

  const [deviceId, content] = Object.entries(input)[0];

  // Convert to generic format
  let data: DataPoint[];

  if (Array.isArray(content.data)) {
    data = content.data.map(point => ({
      timestamp: point.timestamp,
      lat: point.lat,
      lon: point.lon,
      speed: point.speed,
    }));
  } else {
    data = [];
  }

  return { deviceId, data, time: content.time };
}

export function validateMessage(message: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if it's the raw format: {"<deviceId>": { data, time }}
  if (typeof message === 'object' && message !== null) {
    const entries = Object.entries(message);
    if (entries.length === 1) {
      const [deviceId, content] = entries[0] as [string, { data?: unknown; time?: unknown }];

      if (!deviceId || typeof deviceId !== 'string') {
        errors.push('deviceId must be a valid string');
      }

      if (!content || typeof content !== 'object') {
        errors.push('content must be an object');
      } else {
        if (!content.data || !Array.isArray(content.data)) {
          errors.push('data must be an array');
        }

        if (!content.time || typeof content.time !== 'number') {
          errors.push('time must be a number');
        }
      }
    } else {
      errors.push('Message must have exactly one deviceId key');
    }
  } else {
    errors.push('Message must be an object');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function generateIdempotencyKey(message: LegacyPayload): string {
  const normalized = normalizeXRayPayload(message);
  const content = JSON.stringify({
    deviceId: normalized.deviceId,
    time: normalized.time,
    data: normalized.data,
  });
  // Simple hash function for now - in production, use proper crypto
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

export const IDEMP_LUA = `
local v = redis.call('GET', KEYS[1])
if not v then
  redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2])
  return 1
elseif v == ARGV[1] then
  return 0
else
  return -1
end
`;
