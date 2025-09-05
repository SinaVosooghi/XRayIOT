/**
 * Signals Domain Interface
 *
 * This file defines the core interfaces for the Signals domain,
 * providing clear boundaries and contracts for signal processing.
 */

// Import and re-export Paginated from shared-types for domain use
import type { Paginated } from '@iotp/shared-types';
export type { Paginated };

// Core Signal Entity
export interface Signal {
  id: string;
  deviceId: string;
  timestamp: Date;
  dataLength: number;
  dataVolume: number;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  stats?: {
    maxSpeed: number;
    avgSpeed: number;
    distanceMeters: number;
    bbox?: {
      minLat: number;
      maxLat: number;
      minLon: number;
      maxLon: number;
    };
  };
  rawRef: string;
  ingestedAt: Date;
  status: 'processed' | 'failed' | 'pending';
}

// Signal Query Interface
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
  sortBy?: 'timestamp' | 'deviceId' | 'dataLength';
  sortOrder?: 'asc' | 'desc';
}

// Signal Repository Interface
export interface ISignalRepository {
  create(signal: Omit<Signal, 'id'>): Promise<Signal>;
  findById(id: string): Promise<Signal | null>;
  findMany(query: SignalQuery): Promise<Paginated<Signal>>;
  update(id: string, updates: Partial<Signal>): Promise<Signal | null>;
  delete(id: string): Promise<boolean>;
  findByDeviceId(deviceId: string, limit?: number): Promise<Signal[]>;
  findByTimeRange(startTime: Date, endTime: Date): Promise<Signal[]>;
  findByLocationBounds(bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  }): Promise<Signal[]>;
}

// Signal Service Interface
export interface ISignalService {
  processSignal(rawData: RawSignalData): Promise<Signal>;
  getSignals(query: SignalQuery): Promise<Paginated<Signal>>;
  getSignalById(id: string): Promise<Signal | null>;
  updateSignal(id: string, updates: Partial<Signal>): Promise<Signal | null>;
  deleteSignal(id: string): Promise<boolean>;
  getDeviceSignals(deviceId: string, limit?: number): Promise<Signal[]>;
  getSignalsInTimeRange(startTime: Date, endTime: Date): Promise<Signal[]>;
  getSignalsInLocation(bounds: LocationBounds): Promise<Signal[]>;
}

// Raw Signal Data Interface
export interface RawSignalData {
  deviceId: string;
  timestamp: Date;
  data: SignalDataPoint[];
  metadata?: {
    location?: {
      latitude: number;
      longitude: number;
    };
    schemaVersion?: string;
  };
}

// Signal Data Point Interface
export interface SignalDataPoint {
  lat: number;
  lon: number;
  speed: number;
  timestamp?: number;
}

// Location Bounds Interface
export interface LocationBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

// Signal Processing Context
export interface SignalProcessingContext {
  messageId: string;
  deviceId: string;
  timestamp: Date;
  retryCount: number;
  startTime: number;
}

// Signal Processing Result
export interface SignalProcessingResult {
  success: boolean;
  signal?: Signal;
  error?: string;
  processingTime: number;
}
