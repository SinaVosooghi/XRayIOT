import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

class BBox {
  @Prop({ required: true })
  minLat!: number;

  @Prop({ required: true })
  maxLat!: number;

  @Prop({ required: true })
  minLon!: number;

  @Prop({ required: true })
  maxLon!: number;
}

class Location {
  @Prop({ type: String, required: true })
  type!: string;

  @Prop({ type: [Number], required: true })
  coordinates!: [number, number];
}

@Schema({ timestamps: true, collection: 'signals' })
export class XRay extends Document {
  @Prop({ required: true, index: true })
  deviceId!: string;

  @Prop({ required: true, index: true })
  time!: Date;

  @Prop({ required: true })
  dataLength!: number;

  @Prop({ required: true })
  dataVolume!: number;

  @Prop({ type: BBox })
  stats?: {
    maxSpeed?: number;
    avgSpeed?: number;
    distanceMeters?: number;
    bbox?: BBox;
  };

  @Prop()
  rawRef?: string;

  @Prop()
  rawHash?: string;

  @Prop()
  rawSizeBytes?: number;

  @Prop({ type: Location })
  location?: Location;

  @Prop({ index: true, sparse: true })
  idempotencyKey?: string;

  @Prop({ required: true, index: true })
  ingestedAt!: Date;

  @Prop({ required: true, index: true })
  status!: string;
}

export type XRayDocument = XRay & Document;
export const XRaySchema = SchemaFactory.createForClass(XRay);

// Enhanced Indexes with TTL and Performance Optimization
XRaySchema.index({ deviceId: 1, time: -1 }, { name: 'device_time' });
XRaySchema.index({ 'stats.maxSpeed': -1 }, { name: 'max_speed' });
XRaySchema.index(
  { deviceId: 1, time: 1, rawHash: 1 },
  { unique: true, sparse: true, name: 'uniq_device_time_hash' }
);
XRaySchema.index({ location: '2dsphere' }, { name: 'location_2dsphere' });

// New Performance Indexes
XRaySchema.index({ status: 1, time: -1 }, { name: 'status_time' });
XRaySchema.index({ deviceId: 1, status: 1, time: -1 }, { name: 'device_status_time' });
XRaySchema.index({ ingestedAt: 1 }, { name: 'ingested_at' });

// TTL Index for Data Retention (30 days)
XRaySchema.index(
  { ingestedAt: 1 },
  {
    expireAfterSeconds: 2592000, // 30 days
    name: 'ingested_at_ttl',
  }
);

// Compound Index for Common Query Patterns
XRaySchema.index(
  { deviceId: 1, status: 1, time: -1, ingestedAt: 1 },
  { name: 'device_status_time_ingested_compound' }
);
