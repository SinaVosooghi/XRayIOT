// Analytics response types for API app only
export interface DeviceStats {
  deviceId: string;
  totalSignals: number;
  totalDataPoints: number;
  totalDataVolume: number;
  avgDataLength: number;
  avgDataVolume: number;
  firstSeen: Date;
  lastSeen: Date;
  maxSpeed: number;
  avgSpeed: number;
  totalDistance: number;
}

export interface LocationCluster {
  center: {
    lat: number;
    lon: number;
  };
  count: number;
  devices: string[];
  bbox: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
}

export interface TimeTrend {
  period: string;
  count: number;
  dataVolume: number;
  avgDataLength: number;
  deviceCount: number;
}
