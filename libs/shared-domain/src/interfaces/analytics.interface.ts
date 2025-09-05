/**
 * Analytics Domain Interface
 *
 * This file defines the core interfaces for the Analytics domain,
 * providing contracts for data analysis and reporting.
 */

// Note: Signal type is used in method signatures but not directly imported

// Device Statistics Interface
export interface DeviceStats {
  deviceId: string;
  totalSignals: number;
  firstSignal: Date;
  lastSignal: Date;
  totalDistance: number;
  maxSpeed: number;
  avgSpeed: number;
  activeDays: number;
  signalsPerDay: number;
}

// Location Cluster Interface
export interface LocationCluster {
  id: string;
  center: {
    lat: number;
    lon: number;
  };
  radius: number;
  signalCount: number;
  deviceIds: string[];
  timeRange: {
    start: Date;
    end: Date;
  };
}

// Time Trend Interface
export interface TimeTrend {
  period: 'hour' | 'day' | 'week' | 'month';
  timestamp: Date;
  signalCount: number;
  uniqueDevices: number;
  totalDistance: number;
  avgSpeed: number;
  maxSpeed: number;
}

// Analytics Query Interface
export interface AnalyticsQuery {
  deviceIds?: string[];
  startTime?: Date;
  endTime?: Date;
  groupBy?: 'hour' | 'day' | 'week' | 'month';
  limit?: number;
}

// Analytics Service Interface
export interface IAnalyticsService {
  getDeviceStats(deviceId: string, query?: AnalyticsQuery): Promise<DeviceStats>;
  getLocationClusters(query: AnalyticsQuery): Promise<LocationCluster[]>;
  getTimeTrends(query: AnalyticsQuery): Promise<TimeTrend[]>;
  getSignalDensity(bounds: LocationBounds, query?: AnalyticsQuery): Promise<SignalDensityMap>;
  getDeviceHeatmap(deviceId: string, query?: AnalyticsQuery): Promise<HeatmapData>;
  getSpeedAnalysis(query: AnalyticsQuery): Promise<SpeedAnalysis>;
  getDistanceAnalysis(query: AnalyticsQuery): Promise<DistanceAnalysis>;
}

// Import LocationBounds from signals interface
import type { LocationBounds } from './signals.interface';

// Signal Density Map Interface
export interface SignalDensityMap {
  bounds: LocationBounds;
  gridSize: number;
  cells: DensityCell[];
}

// Density Cell Interface
export interface DensityCell {
  lat: number;
  lon: number;
  count: number;
  intensity: number; // 0-1 scale
}

// Heatmap Data Interface
export interface HeatmapData {
  deviceId: string;
  bounds: LocationBounds;
  gridSize: number;
  cells: HeatmapCell[];
  timeRange: {
    start: Date;
    end: Date;
  };
}

// Heatmap Cell Interface
export interface HeatmapCell {
  lat: number;
  lon: number;
  intensity: number; // 0-1 scale
  timestamp: Date;
}

// Speed Analysis Interface
export interface SpeedAnalysis {
  average: number;
  median: number;
  max: number;
  min: number;
  percentiles: {
    p25: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
  distribution: SpeedBucket[];
}

// Speed Bucket Interface
export interface SpeedBucket {
  range: {
    min: number;
    max: number;
  };
  count: number;
  percentage: number;
}

// Distance Analysis Interface
export interface DistanceAnalysis {
  total: number;
  average: number;
  max: number;
  min: number;
  byDevice: DeviceDistance[];
  byTimePeriod: TimePeriodDistance[];
}

// Device Distance Interface
export interface DeviceDistance {
  deviceId: string;
  totalDistance: number;
  averageDistance: number;
  maxDistance: number;
  signalCount: number;
}

// Time Period Distance Interface
export interface TimePeriodDistance {
  period: string;
  totalDistance: number;
  averageDistance: number;
  signalCount: number;
}
