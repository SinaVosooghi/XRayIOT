// Canonical Signal DTOs for the XRayIOT project

// Canonical Data Point - readable object format
export interface DataPoint {
  timestamp: number;
  lat: number;
  lon: number;
  speed: number;
}

// Canonical Create Signal DTO
export interface CreateSignalDto {
  deviceId: string;
  time: number;
  data: DataPoint[];
  rawRef?: string;
}

// Base Query DTO with common fields
export interface BaseQuerySignalsDto {
  deviceId?: string;
  from?: string;
  to?: string;
  limit?: number;
  skip?: number;
  cursor?: string;
  fields?: string;
}

// Extended Query DTO with additional filtering options
export interface ExtendedQuerySignalsDto extends BaseQuerySignalsDto {
  // Enhanced filtering options
  minDataLength?: number;
  maxDataLength?: number;
  minDataVolume?: number;
  maxDataVolume?: number;

  // Location filtering
  minLat?: number;
  maxLat?: number;
  minLon?: number;
  maxLon?: number;

  // Sorting options
  sortBy?: 'time' | 'deviceId' | 'dataLength' | 'dataVolume' | 'createdAt';
  sortOrder?: 'asc' | 'desc';

  // Search options
  search?: string; // Search in deviceId
}

// Canonical Signal Response
export interface SignalDto {
  _id: string;
  deviceId: string;
  time: Date;
  dataLength: number;
  dataVolume: number;
  stats?: {
    maxSpeed?: number;
    avgSpeed?: number;
    distanceMeters?: number;
    bbox?: {
      minLat: number;
      maxLat: number;
      minLon: number;
      maxLon: number;
    };
  };
  rawRef?: string;
  rawHash?: string;
  rawSizeBytes?: number;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude] - GeoJSON standard
  };
  createdAt: Date;
  updatedAt: Date;
}
