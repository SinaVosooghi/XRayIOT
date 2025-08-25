import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { byteLengthUtf8, haversineMeters } from '@iotp/shared-utils';
import { IRawStore } from '../raw/interfaces';
import { XRayDocument, XRayPayloadAllFormats, RawPayload } from '../types';

@Injectable()
export class XRayService {
  private readonly log = new Logger(XRayService.name);

  constructor(
    @InjectModel('XRay') private model: Model<XRayDocument>,
    @Inject('IRawStore') private rawStore: IRawStore
  ) {}

  async saveFromNormalizedPayload(norm: XRayPayloadAllFormats): Promise<XRayDocument> {
    // Extract deviceId from legacy format
    const deviceId = Object.keys(norm)[0];
    const { data: samples, time } = norm[deviceId];
    const ts = new Date(time ?? Date.now());

    const dataLength = samples.length;
    const dataVolume = byteLengthUtf8(JSON.stringify(norm));

    let maxSpeed = 0,
      sumSpeed = 0,
      distance = 0;
    let minLat = +Infinity,
      maxLat = -Infinity,
      minLon = +Infinity,
      maxLon = -Infinity;

    for (let i = 0; i < samples.length; i++) {
      const { lat, lon, speed } = samples[i];
      maxSpeed = Math.max(maxSpeed, speed || 0);
      sumSpeed += speed || 0;
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);

      if (i > 0) {
        const { lat: latPrev, lon: lonPrev } = samples[i - 1];
        distance += haversineMeters(latPrev, lonPrev, lat, lon);
      }
    }

    const avgSpeed = dataLength ? sumSpeed / dataLength : 0;

    // Representative Point: first coordinate as GeoJSON
    const first = samples[0];
    const location = first
      ? { type: 'Point' as const, coordinates: [first.lon, first.lat] as [number, number] }
      : undefined;

    // Calculate bounding box
    const bbox = isFinite(minLat) ? { minLat, maxLat, minLon, maxLon } : undefined;

    // Calculate stats
    const stats = dataLength
      ? {
          maxSpeed,
          avgSpeed,
          distanceMeters: Math.round(distance),
          bbox,
        }
      : undefined;

    // Save raw externally and store reference
    const rawRef = await this.rawStore.store(norm as unknown as RawPayload);

    return this.model.create({
      deviceId,
      time: ts,
      dataLength,
      dataVolume,
      stats,
      rawRef,
      location,
    });
  }

  async processBatch(messages: XRayPayloadAllFormats[]): Promise<XRayDocument[]> {
    const results: XRayDocument[] = [];

    for (const message of messages) {
      try {
        const result = await this.saveFromNormalizedPayload(message);
        results.push(result);
      } catch (error) {
        this.log.error(`Failed to process message`, error);
        // Continue processing other messages
      }
    }

    return results;
  }
}
