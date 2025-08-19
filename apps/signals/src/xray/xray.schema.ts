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
}

export type XRayDocument = XRay & Document;
export const XRaySchema = SchemaFactory.createForClass(XRay);

// Indexes
XRaySchema.index({ deviceId: 1, time: -1 }, { name: 'device_time' });
XRaySchema.index({ 'stats.maxSpeed': -1 }, { name: 'max_speed' });
XRaySchema.index(
  { deviceId: 1, time: 1, rawHash: 1 },
  { unique: true, sparse: true, name: 'uniq_device_time_hash' }
);
XRaySchema.index({ location: '2dsphere' }); // Add 2dsphere index separately
