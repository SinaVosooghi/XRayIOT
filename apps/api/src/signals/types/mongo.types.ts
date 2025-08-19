// MongoDB specific types for API app only
export interface MongoFilter {
  deviceId?: string | { $regex: string; $options: string };
  time?: { $gte?: Date; $lte?: Date };
  _id?: { $lt: unknown }; // Using unknown for ObjectId compatibility
  dataLength?: { $gte?: number; $lte?: number };
  dataVolume?: { $gte?: number; $lte?: number };
  location?: {
    $geoWithin: {
      $box: [[number, number], [number, number]];
    };
  };
  [key: string]: unknown; // Allow additional MongoDB operators
}

export interface MongoSort {
  [key: string]: 1 | -1;
}

export interface MongoProjection {
  [key: string]: 0 | 1;
}
