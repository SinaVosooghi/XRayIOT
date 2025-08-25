// Standardized geographic types for the XRayIOT project

// GeoJSON Point (standard format)
export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude] - GeoJSON standard
}

// 3D Coordinate with speed
export interface Coordinate3D {
  lat: number;
  lon: number;
  speed: number;
}

// 2D Coordinate
export interface Coordinate2D {
  lat: number;
  lon: number;
}

// Bounding Box
export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

// Geographic Range
export interface GeoRange {
  center: Coordinate2D;
  radiusKm: number;
}

// Geographic Filter
export interface GeoFilter {
  bbox?: BoundingBox;
  radius?: GeoRange;
  polygon?: Coordinate2D[];
}

// Coordinate Validation
export interface CoordinateValidation {
  isValidLatitude(lat: number): boolean;
  isValidLongitude(lon: number): boolean;
  isValidSpeed(speed: number): boolean;
  isValidCoordinate(lat: number, lon: number): boolean;
}

// Coordinate Constants
export const COORDINATE_LIMITS = {
  LATITUDE: { min: -90, max: 90 },
  LONGITUDE: { min: -180, max: 180 },
  SPEED: { min: 0, max: 1000 }, // km/h
} as const;

// Coordinate Validation Functions
export const isValidLatitude = (lat: number): boolean =>
  lat >= COORDINATE_LIMITS.LATITUDE.min && lat <= COORDINATE_LIMITS.LATITUDE.max;

export const isValidLongitude = (lon: number): boolean =>
  lon >= COORDINATE_LIMITS.LONGITUDE.min && lon <= COORDINATE_LIMITS.LONGITUDE.max;

export const isValidSpeed = (speed: number): boolean =>
  speed >= COORDINATE_LIMITS.SPEED.min && speed <= COORDINATE_LIMITS.SPEED.max;

export const isValidCoordinate = (lat: number, lon: number): boolean =>
  isValidLatitude(lat) && isValidLongitude(lon);

// Conversion Functions
export const toGeoJSON = (coord: Coordinate3D): GeoJSONPoint => ({
  type: 'Point',
  coordinates: [coord.lon, coord.lat], // GeoJSON: [longitude, latitude]
});

export const toGeoJSON2D = (coord: Coordinate2D): GeoJSONPoint => ({
  type: 'Point',
  coordinates: [coord.lon, coord.lat],
});

export const fromGeoJSON = (point: GeoJSONPoint): Coordinate2D => ({
  lat: point.coordinates[1], // latitude is second
  lon: point.coordinates[0], // longitude is first
});

export const toCoordinate3D = (lat: number, lon: number, speed: number): Coordinate3D => ({
  lat,
  lon,
  speed,
});

export const toCoordinate2D = (lat: number, lon: number): Coordinate2D => ({
  lat,
  lon,
});

// Distance Calculations
export const calculateDistance = (coord1: Coordinate2D, coord2: Coordinate2D): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLon = ((coord2.lon - coord1.lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Bounding Box Calculations
export const calculateBoundingBox = (coordinates: Coordinate2D[]): BoundingBox => {
  if (coordinates.length === 0) {
    throw new Error('Cannot calculate bounding box for empty coordinate array');
  }

  const lats = coordinates.map(c => c.lat);
  const lons = coordinates.map(c => c.lon);

  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLon: Math.min(...lons),
    maxLon: Math.max(...lons),
  };
};

export const isPointInBoundingBox = (point: Coordinate2D, bbox: BoundingBox): boolean => {
  return (
    point.lat >= bbox.minLat &&
    point.lat <= bbox.maxLat &&
    point.lon >= bbox.minLon &&
    point.lon <= bbox.maxLon
  );
};

export const isPointInRadius = (
  point: Coordinate2D,
  center: Coordinate2D,
  radiusKm: number
): boolean => {
  const distance = calculateDistance(point, center);
  return distance <= radiusKm;
};

// Coordinate Array Utilities
export const extractLatitudes = (coordinates: Coordinate2D[]): number[] =>
  coordinates.map(c => c.lat);

export const extractLongitudes = (coordinates: Coordinate2D[]): number[] =>
  coordinates.map(c => c.lon);

export const extractSpeeds = (coordinates: Coordinate3D[]): number[] =>
  coordinates.map(c => c.speed);

// Geographic Statistics
export interface GeoStats {
  center: Coordinate2D;
  bbox: BoundingBox;
  totalDistance: number;
  averageSpeed: number;
  maxSpeed: number;
  minSpeed: number;
}

export const calculateGeoStats = (coordinates: Coordinate3D[]): GeoStats => {
  if (coordinates.length === 0) {
    throw new Error('Cannot calculate geo stats for empty coordinate array');
  }

  const speeds = extractSpeeds(coordinates);
  const coords2D: Coordinate2D[] = coordinates.map(c => ({ lat: c.lat, lon: c.lon }));

  let totalDistance = 0;
  for (let i = 1; i < coords2D.length; i++) {
    totalDistance += calculateDistance(coords2D[i - 1], coords2D[i]);
  }

  const center: Coordinate2D = {
    lat: coords2D.reduce((sum, c) => sum + c.lat, 0) / coords2D.length,
    lon: coords2D.reduce((sum, c) => sum + c.lon, 0) / coords2D.length,
  };

  return {
    center,
    bbox: calculateBoundingBox(coords2D),
    totalDistance,
    averageSpeed: speeds.reduce((sum, s) => sum + s, 0) / speeds.length,
    maxSpeed: Math.max(...speeds),
    minSpeed: Math.min(...speeds),
  };
};
