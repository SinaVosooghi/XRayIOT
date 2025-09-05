/**
 * Signals Domain Service
 *
 * This service implements the core business logic for signal processing
 * using the existing type system from shared-types.
 */

import { Injectable, Inject } from '@nestjs/common';
import { SignalDto, DataPoint, Paginated, ValidationResult } from '@iotp/shared-types';

// Use the interface version for domain service
interface CreateSignalDto {
  deviceId: string;
  time: number;
  data: DataPoint[];
  rawRef?: string;
}
// Remove ValidationService dependency for now

// Domain-specific interfaces that extend the base types
export interface SignalProcessingContext {
  readonly messageId: string;
  readonly deviceId: string;
  readonly timestamp: Date;
  readonly retryCount: number;
  readonly startTime: number;
}

export interface SignalProcessingResult {
  readonly success: boolean;
  readonly signal?: SignalDto;
  readonly error?: string;
  readonly processingTime: number;
}

export interface SignalRepository {
  create(signal: Omit<SignalDto, '_id' | 'createdAt' | 'updatedAt'>): Promise<SignalDto>;
  findById(id: string): Promise<SignalDto | null>;
  findMany(query: SignalQuery): Promise<Paginated<SignalDto>>;
  update(id: string, updates: Partial<SignalDto>): Promise<SignalDto | null>;
  delete(id: string): Promise<boolean>;
  findByDeviceId(deviceId: string, limit?: number): Promise<SignalDto[]>;
  findByTimeRange(startTime: Date, endTime: Date): Promise<SignalDto[]>;
  findByLocationBounds(bounds: LocationBounds): Promise<SignalDto[]>;
}

export interface SignalQuery {
  page?: number;
  limit?: number;
  deviceId?: string;
  startTime?: Date;
  endTime?: Date;
  minLat?: number;
  maxLat?: number;
  minLon?: number;
  maxLon?: number;
  sortBy?: 'time' | 'deviceId' | 'dataLength' | 'dataVolume' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface LocationBounds {
  readonly minLat: number;
  readonly maxLat: number;
  readonly minLon: number;
  readonly maxLon: number;
}

export interface RawPayloadStore {
  store(payload: CreateSignalDto): Promise<string>;
  get(id: string): Promise<CreateSignalDto | null>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
}

@Injectable()
export class SignalsDomainService {
  constructor(
    @Inject('SignalRepository') private readonly signalRepository: SignalRepository,
    @Inject('RawPayloadStore') private readonly rawStore: RawPayloadStore
  ) {}

  /**
   * Process a raw signal and create a processed signal
   */
  async processSignal(
    rawData: CreateSignalDto,
    _context: SignalProcessingContext
  ): Promise<SignalProcessingResult> {
    const startTime = Date.now();

    try {
      // Validate raw data
      const validationResult = this.validateRawSignal(rawData);
      if (!validationResult.valid) {
        return {
          success: false,
          error: `Validation failed: ${validationResult.errorMessage}`,
          processingTime: Date.now() - startTime,
        };
      }

      // Process the signal data
      const processedSignal = await this.processRawData(rawData);

      // Store in repository
      const signal = await this.signalRepository.create(processedSignal);

      return {
        success: true,
        signal,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Get signals with pagination and filtering
   */
  async getSignals(query: SignalQuery): Promise<Paginated<SignalDto>> {
    return this.signalRepository.findMany(query);
  }

  /**
   * Get a signal by ID
   */
  async getSignalById(id: string): Promise<SignalDto | null> {
    return this.signalRepository.findById(id);
  }

  /**
   * Update a signal
   */
  async updateSignal(id: string, updates: Partial<SignalDto>): Promise<SignalDto | null> {
    return this.signalRepository.update(id, updates);
  }

  /**
   * Delete a signal
   */
  async deleteSignal(id: string): Promise<boolean> {
    return this.signalRepository.delete(id);
  }

  /**
   * Get signals for a specific device
   */
  async getDeviceSignals(deviceId: string, limit?: number): Promise<SignalDto[]> {
    return this.signalRepository.findByDeviceId(deviceId, limit);
  }

  /**
   * Get signals within a time range
   */
  async getSignalsInTimeRange(startTime: Date, endTime: Date): Promise<SignalDto[]> {
    return this.signalRepository.findByTimeRange(startTime, endTime);
  }

  /**
   * Get signals within location bounds
   */
  async getSignalsInLocation(bounds: LocationBounds): Promise<SignalDto[]> {
    return this.signalRepository.findByLocationBounds(bounds);
  }

  /**
   * Validate raw signal data
   */
  private validateRawSignal(rawData: CreateSignalDto): ValidationResult<CreateSignalDto> {
    // Simple validation for now - in a real implementation, you'd use the ValidationService
    // with proper DTO classes or implement custom validation logic
    const errors: string[] = [];

    if (!rawData.deviceId || rawData.deviceId.length === 0) {
      errors.push('Device ID is required');
    }

    if (!rawData.time || rawData.time <= 0) {
      errors.push('Valid time is required');
    }

    if (!rawData.data || !Array.isArray(rawData.data) || rawData.data.length === 0) {
      errors.push('Data array is required and cannot be empty');
    }

    if (errors.length > 0) {
      return {
        valid: false,
        errorMessage: errors.join(', '),
      };
    }

    return {
      valid: true,
      data: rawData,
    };
  }

  /**
   * Process raw data into a signal
   */
  private async processRawData(
    rawData: CreateSignalDto
  ): Promise<Omit<SignalDto, '_id' | 'createdAt' | 'updatedAt'>> {
    const { deviceId, time, data } = rawData;

    // Calculate statistics
    const stats = this.calculateStats(data);

    // Determine location
    const location = this.calculateLocation(data);

    // Store raw payload
    const rawRef = await this.rawStore.store(rawData);

    return {
      deviceId,
      time: new Date(time),
      dataLength: data.length,
      dataVolume: JSON.stringify(rawData).length,
      location,
      stats,
      rawRef,
    };
  }

  /**
   * Calculate statistics from data points
   */
  private calculateStats(data: DataPoint[]): SignalDto['stats'] {
    if (data.length === 0) return undefined;

    let maxSpeed = 0;
    let sumSpeed = 0;
    let distance = 0;
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLon = Infinity;
    let maxLon = -Infinity;

    for (let i = 0; i < data.length; i++) {
      const { lat, lon, speed } = data[i];
      maxSpeed = Math.max(maxSpeed, speed || 0);
      sumSpeed += speed || 0;
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);

      if (i > 0) {
        const { lat: latPrev, lon: lonPrev } = data[i - 1];
        distance += this.haversineDistance(latPrev, lonPrev, lat, lon);
      }
    }

    const avgSpeed = data.length ? sumSpeed / data.length : 0;

    return {
      maxSpeed,
      avgSpeed,
      distanceMeters: Math.round(distance),
      bbox: isFinite(minLat) ? { minLat, maxLat, minLon, maxLon } : undefined,
    };
  }

  /**
   * Calculate location from data points
   */
  private calculateLocation(data: DataPoint[]): SignalDto['location'] {
    if (data.length === 0) return undefined;

    const first = data[0];
    return {
      type: 'Point',
      coordinates: [first.lon, first.lat], // GeoJSON format: [longitude, latitude]
    };
  }

  /**
   * Calculate haversine distance between two points
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
