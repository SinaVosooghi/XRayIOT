/**
 * Mongoose Type Definitions
 *
 * This file provides proper TypeScript types for Mongoose operations
 * to ensure type safety in our domain implementations.
 */

// Mongoose Document interface for Signal
export interface SignalDocument {
  _id: { toString(): string };
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

// Mongoose Query interface for chained operations
export interface MongooseQuery<T> {
  sort(sort: Record<string, 1 | -1>): MongooseQuery<T>;
  skip(skip: number): MongooseQuery<T>;
  limit(limit: number): Promise<T[]>;
  exec(): Promise<T[]>;
}

// Mongoose Model interface
export interface MongooseModel<T> {
  create(data: Partial<T>): Promise<T>;
  findById(id: string): Promise<T | null>;
  find(query: Record<string, unknown>): MongooseQuery<T>;
  countDocuments(query: Record<string, unknown>): Promise<number>;
  findByIdAndUpdate(id: string, updates: Partial<T>, options: { new: boolean }): Promise<T | null>;
  findByIdAndDelete(id: string): Promise<T | null>;
}

// Raw Payload Document interface
export interface RawPayloadDocument {
  _id: { toString(): string };
  deviceId: string;
  timestamp: Date;
  data: unknown;
  metadata?: Record<string, unknown>;
  filename: string;
  uploadDate: Date;
  contentType?: string;
}
