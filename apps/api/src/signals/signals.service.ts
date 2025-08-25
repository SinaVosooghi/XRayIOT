import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { Response } from 'express';
import { GridFSBucket, ObjectId } from 'mongodb';
import * as crypto from 'crypto';
import { SignalsValidationService } from './signals-validation.service';
import { XRaySignalsPayload, Paginated, SignalDto, XRayDocument } from '@iotp/shared-types';
import {
  SignalQuery,
  DeviceStatsQuery,
  LocationClustersQuery,
  TimeTrendsQuery,
  MongoFilter,
  MongoProjection,
  MongoSort,
} from './types';

@Injectable()
export class SignalsService {
  private gfs: GridFSBucket;

  constructor(
    @InjectModel('XRay') private model: Model<XRayDocument>,
    @InjectConnection() private readonly conn: Connection,
    private readonly validationService: SignalsValidationService
  ) {
    if (!this.conn.db) {
      throw new Error('Database connection not available');
    }
    this.gfs = new GridFSBucket(this.conn.db, { bucketName: 'rawPayloads' });
  }

  async findAll(querySignalsDto: SignalQuery): Promise<Paginated<SignalDto>> {
    // Validate query parameters
    this.validationService.validateQueryParams(querySignalsDto);

    const filter: MongoFilter = {};

    // Basic filtering
    if (querySignalsDto.deviceId) filter.deviceId = querySignalsDto.deviceId;

    // Time range filtering
    if (querySignalsDto.from || querySignalsDto.to) {
      filter.time = {};
      if (querySignalsDto.from) filter.time.$gte = new Date(querySignalsDto.from);
      if (querySignalsDto.to) filter.time.$lte = new Date(querySignalsDto.to);
    }

    // Cursor-based pagination
    if (querySignalsDto.cursor) {
      filter._id = Types.ObjectId.isValid(querySignalsDto.cursor)
        ? { $lt: new Types.ObjectId(querySignalsDto.cursor) }
        : filter.time
          ? { ...filter.time, $lt: new Date(parseInt(querySignalsDto.cursor)) }
          : { $lt: new Date(parseInt(querySignalsDto.cursor)) };
    }

    // Data length filtering
    if (querySignalsDto.minDataLength || querySignalsDto.maxDataLength) {
      filter.dataLength = {};
      if (querySignalsDto.minDataLength) filter.dataLength.$gte = querySignalsDto.minDataLength;
      if (querySignalsDto.maxDataLength) filter.dataLength.$lte = querySignalsDto.maxDataLength;
    }

    // Data volume filtering
    if (querySignalsDto.minDataVolume || querySignalsDto.maxDataVolume) {
      filter.dataVolume = {};
      if (querySignalsDto.minDataVolume) filter.dataVolume.$gte = querySignalsDto.minDataVolume;
      if (querySignalsDto.maxDataVolume) filter.dataVolume.$lte = querySignalsDto.maxDataVolume;
    }

    // Location filtering (bounding box)
    if (
      querySignalsDto.minLat ||
      querySignalsDto.maxLat ||
      querySignalsDto.minLon ||
      querySignalsDto.maxLon
    ) {
      filter.location = {
        $geoWithin: {
          $box: [
            [querySignalsDto.minLon || -180, querySignalsDto.minLat || -90],
            [querySignalsDto.maxLon || 180, querySignalsDto.maxLat || 90],
          ],
        },
      };
    }

    // Search in deviceId (case-insensitive)
    if (querySignalsDto.search) {
      filter.deviceId = { $regex: querySignalsDto.search, $options: 'i' };
    }

    const limit = Math.max(1, Math.min(100, parseInt(String(querySignalsDto.limit || '20'), 10)));
    const skip = Math.max(0, parseInt(String(querySignalsDto.skip || '0'), 10));

    const projection = (querySignalsDto.fields || '')
      .split(',')
      .filter(Boolean)
      .reduce(
        (acc: MongoProjection, f: string) => ((acc[f.trim()] = 1), acc),
        {} as MongoProjection
      );

    // Sorting
    let sortOptions: MongoSort = { _id: -1 }; // Default sort
    if (querySignalsDto.sortBy) {
      const sortOrder = querySignalsDto.sortOrder === 'asc' ? 1 : -1;
      sortOptions = { [querySignalsDto.sortBy]: sortOrder };
    }

    const docs = await this.model
      .find(filter, projection)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.model.countDocuments(filter);
    const page = Math.floor(skip / limit) + 1;
    const hasNext = skip + docs.length < total;
    const hasPrev = skip > 0;
    const nextCursor = docs.length ? docs[docs.length - 1]._id : null;

    return {
      items: docs as unknown as SignalDto[],
      total,
      page,
      limit,
      hasNext,
      hasPrev,
      cursor: nextCursor
        ? typeof nextCursor === 'string'
          ? nextCursor
          : nextCursor instanceof ObjectId
            ? nextCursor.toString()
            : typeof nextCursor === 'object'
              ? JSON.stringify(nextCursor)
              : String(nextCursor)
        : undefined,
    };
  }

  async findOne(id: string): Promise<SignalDto> {
    const signal = await this.model.findById(id);
    if (!signal) {
      throw new NotFoundException(`Signal with ID ${id} not found`);
    }
    return signal as unknown as SignalDto;
  }

  async create(createSignalDto: XRaySignalsPayload): Promise<SignalDto> {
    // Validate input data
    this.validationService.validateSignalData(createSignalDto);

    // Calculate required fields
    const dataLength = createSignalDto.data ? createSignalDto.data.length : 0;
    const dataVolume = JSON.stringify(createSignalDto).length;

    // Convert time to Date if it's a number
    const time =
      typeof createSignalDto.time === 'number'
        ? new Date(createSignalDto.time)
        : createSignalDto.time;

    // Calculate location from first data point if available
    // Data format: [timestamp, [lat, lon, speed]]
    // GeoJSON format: [longitude, latitude]
    let location = undefined;
    if (createSignalDto.data && createSignalDto.data.length > 0 && createSignalDto.data[0][1]) {
      const [lat, lon] = createSignalDto.data[0][1]; // Extract lat, lon from [lat, lon, speed]
      location = { type: 'Point', coordinates: [lon, lat] }; // [longitude, latitude]
    }

    // Generate unique idempotency key
    const idempotencyKey = crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          deviceId: createSignalDto.deviceId,
          time: createSignalDto.time,
          data: createSignalDto.data,
        })
      )
      .digest('hex');

    const signalData = {
      ...createSignalDto,
      time,
      dataLength,
      dataVolume,
      location,
      idempotencyKey,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.model.create(signalData);
    return result as unknown as SignalDto;
  }

  async update(id: string, updateSignalDto: Partial<XRaySignalsPayload>): Promise<SignalDto> {
    const updatedSignal = await this.model.findByIdAndUpdate(
      id,
      { ...updateSignalDto, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedSignal) {
      throw new NotFoundException(`Signal with ID ${id} not found`);
    }

    return updatedSignal as unknown as SignalDto;
  }

  async remove(id: string): Promise<boolean> {
    const deletedSignal = await this.model.findByIdAndDelete(id);
    if (!deletedSignal) {
      throw new NotFoundException(`Signal with ID ${id} not found`);
    }
    return true;
  }

  streamRawData(rawRef: string, res: Response) {
    try {
      const objectId = new ObjectId(rawRef);
      const downloadStream = this.gfs.openDownloadStream(objectId);

      // Set proper headers for binary data
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', 'attachment');

      downloadStream.on('error', () => {
        console.error('Error streaming raw data');
        res.status(500).json({ error: 'Failed to stream raw data' });
      });

      downloadStream.pipe(res);
    } catch {
      throw new BadRequestException('Invalid raw data reference');
    }
  }

  async getRawMetadata(rawRef: string) {
    try {
      const objectId = new ObjectId(rawRef);
      const files = await this.gfs.find({ _id: objectId }).toArray();

      if (files.length === 0) {
        throw new NotFoundException('Raw data not found');
      }

      const file = files[0];

      return {
        filename: file.filename,
        length: file.length,
        uploadDate: file.uploadDate,
        metadata: file.metadata,
        contentType: file.contentType || 'application/octet-stream', // Provide default if missing
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Invalid raw data reference');
    }
  }

  async getStorageStats() {
    try {
      if (!this.conn.db) {
        throw new Error('Database connection not available');
      }

      // Try to get stats from the rawPayloads.files collection
      const stats = (await this.conn.db.admin().command({
        collStats: 'rawPayloads.files',
      })) as Record<string, unknown>;

      const count = (stats.count as number) || 0;
      const size = (stats.size as number) || 0;
      const storageSize = (stats.storageSize as number) || 0;
      const indexSize = (stats.totalIndexSize as number) || 0;

      return {
        totalFiles: count,
        totalSize: size,
        avgFileSize: count && size ? size / count : 0,
        storageSize,
        indexSize,
      };
    } catch {
      // If admin command fails, try to get basic stats from the collection
      try {
        if (this.conn.db) {
          const collection = this.conn.db.collection('rawPayloads.files');
          const count = await collection.countDocuments();

          return {
            totalFiles: count,
            totalSize: 0, // We can't get size without admin privileges
            avgFileSize: 0,
            storageSize: 0,
            indexSize: 0,
          };
        }
      } catch {
        // Fall through to default values
      }

      // Return default values if both methods fail
      return {
        totalFiles: 0,
        totalSize: 0,
        avgFileSize: 0,
        storageSize: 0,
        indexSize: 0,
      };
    }
  }

  async getDeviceStats(query: DeviceStatsQuery): Promise<
    Array<{
      _id: string;
      totalSignals: number;
      totalDataVolume: number;
      avgDataLength: number;
      avgDataVolume: number;
      firstSeen: Date;
      lastSeen: Date;
      totalDistance: number;
      maxSpeed: number;
      avgSpeed: number;
    }>
  > {
    const filter: MongoFilter = {};

    if (query.deviceId) filter.deviceId = query.deviceId;
    if (query.from || query.to) {
      filter.time = {};
      if (query.from) filter.time.$gte = new Date(query.from);
      if (query.to) filter.time.$lte = new Date(query.to);
    }

    const stats = await this.model.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$deviceId',
          totalSignals: { $sum: 1 },
          totalDataVolume: { $sum: '$dataVolume' },
          avgDataLength: { $avg: '$dataLength' },
          avgDataVolume: { $avg: '$dataVolume' },
          firstSeen: { $min: '$time' },
          lastSeen: { $max: '$time' },
          totalDistance: { $sum: { $ifNull: ['$stats.distanceMeters', 0] } },
          maxSpeed: { $max: { $ifNull: ['$stats.maxSpeed', 0] } },
          avgSpeed: { $avg: { $ifNull: ['$stats.avgSpeed', 0] } },
        },
      },
      { $sort: { totalSignals: -1 } },
    ]);

    return stats as Array<{
      _id: string;
      totalSignals: number;
      totalDataVolume: number;
      avgDataLength: number;
      avgDataVolume: number;
      firstSeen: Date;
      lastSeen: Date;
      totalDistance: number;
      maxSpeed: number;
      avgSpeed: number;
    }>;
  }

  async getLocationClusters(query: LocationClustersQuery): Promise<
    Array<{
      _id: { lat: number; lon: number };
      count: number;
      deviceIds: string[];
      avgDataLength: number;
      avgDataVolume: number;
    }>
  > {
    const filter: MongoFilter = {};

    if (query.from || query.to) {
      filter.time = {};
      if (query.from) filter.time.$gte = new Date(query.from);
      if (query.to) filter.time.$lte = new Date(query.to);
    }

    const limit = Math.min(parseInt(String(query.limit || '10')), 50);

    const clusters = await this.model.aggregate([
      { $match: filter },
      { $match: { location: { $exists: true } } },
      {
        $group: {
          _id: {
            lat: { $round: [{ $arrayElemAt: ['$location.coordinates', 1] }, 2] }, // Extract lat and round to 2 decimal places
            lon: { $round: [{ $arrayElemAt: ['$location.coordinates', 0] }, 2] }, // Extract lon and round to 2 decimal places
          },
          count: { $sum: 1 },
          deviceIds: { $addToSet: '$deviceId' },
          avgDataLength: { $avg: '$dataLength' },
          avgDataVolume: { $avg: '$dataVolume' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    return clusters as Array<{
      _id: { lat: number; lon: number };
      count: number;
      deviceIds: string[];
      avgDataLength: number;
      avgDataVolume: number;
    }>;
  }

  async getTimeTrends(query: TimeTrendsQuery): Promise<
    Array<{
      _id: Record<string, number>;
      count: number;
      totalDataVolume: number;
      avgDataLength: number;
      uniqueDevices: string[];
      uniqueDeviceCount: number;
    }>
  > {
    const filter: MongoFilter = {};

    if (query.from || query.to) {
      filter.time = {};
      if (query.from) filter.time.$gte = new Date(query.from);
      if (query.to) filter.time.$lte = new Date(query.to);
    }

    const period = query.period || 'day';
    let dateFormat: Record<string, string>;

    switch (period) {
      case 'hour':
        dateFormat = { year: '$year', month: '$month', day: '$dayOfMonth', hour: '$hour' };
        break;
      case 'week':
        dateFormat = { year: '$year', week: '$week' };
        break;
      case 'month':
        dateFormat = { year: '$year', month: '$month' };
        break;
      default: // day
        dateFormat = { year: '$year', month: '$month', day: '$dayOfMonth' };
    }

    const trends = await this.model.aggregate([
      { $match: filter },
      {
        $group: {
          _id: dateFormat,
          count: { $sum: 1 },
          totalDataVolume: { $sum: '$dataVolume' },
          avgDataLength: { $avg: '$dataLength' },
          uniqueDevices: { $addToSet: '$deviceId' },
        },
      },
      {
        $addFields: {
          uniqueDeviceCount: { $size: '$uniqueDevices' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } },
    ]);

    return trends as Array<{
      _id: Record<string, number>;
      count: number;
      totalDataVolume: number;
      avgDataLength: number;
      uniqueDevices: string[];
      uniqueDeviceCount: number;
    }>;
  }
}
