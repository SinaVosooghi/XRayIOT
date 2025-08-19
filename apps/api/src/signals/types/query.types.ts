// Query and filter types for API app only
export interface BaseQuery {
  limit?: number;
  skip?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SignalQuery extends BaseQuery {
  deviceId?: string;
  from?: string;
  to?: string;
  cursor?: string;
  fields?: string;
  minDataLength?: number;
  maxDataLength?: number;
  minDataVolume?: number;
  maxDataVolume?: number;
  minLat?: number;
  maxLat?: number;
  minLon?: number;
  maxLon?: number;
  search?: string;
}

export interface DeviceStatsQuery extends BaseQuery {
  deviceId?: string;
  from?: string;
  to?: string;
  groupBy?: 'hour' | 'day' | 'week' | 'month';
}

export interface LocationClustersQuery extends BaseQuery {
  from?: string;
  to?: string;
  minCount?: number;
  maxDistance?: number;
}

export interface TimeTrendsQuery extends BaseQuery {
  from?: string;
  to?: string;
  period?: 'hour' | 'day' | 'week' | 'month';
  groupBy?: 'device' | 'time';
}
