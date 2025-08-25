// Legacy XRay DTOs - DEPRECATED: Use signal.dto.ts instead
// This file is kept for backward compatibility during migration

import { IsString, IsNumber, IsArray, IsOptional, IsDateString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

// Helper decorators to avoid repetition
const TransformToInt = () => Transform(({ value }: { value: unknown }) => parseInt(String(value)));
const TransformToFloat = () =>
  Transform(({ value }: { value: unknown }) => parseFloat(String(value)));

// DEPRECATED: Use CreateSignalDto from signal.dto.ts instead
export class CreateSignalDto {
  @IsString()
  deviceId!: string;

  @IsNumber()
  time!: number;

  @IsArray()
  data!: Array<[number, [number, number, number]]>; // [timestamp, [lat, lon, speed]]
}

// DEPRECATED: Use CreateSignalDto from signal.dto.ts instead
export class CreateSignalDtoWithValidation {
  @IsString()
  deviceId!: string;

  @IsNumber()
  time!: number;

  @IsArray()
  data!: Array<[number, [number, number, number]]>; // [timestamp, [lat, lon, speed]]
}

// DEPRECATED: Use ExtendedQuerySignalsDto from signal.dto.ts instead
export class QuerySignalsDto {
  @IsOptional() @IsString() deviceId?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;

  @IsOptional()
  @TransformToInt()
  @IsNumber()
  limit = 20;
  @IsOptional() @IsString() cursor?: string;
  @IsOptional()
  @TransformToInt()
  @IsNumber()
  skip?: number;

  @IsOptional() @IsString() fields?: string;

  // Enhanced filtering options
  @IsOptional()
  @TransformToInt()
  @IsNumber()
  minDataLength?: number;
  @IsOptional()
  @TransformToInt()
  @IsNumber()
  maxDataLength?: number;
  @IsOptional()
  @TransformToInt()
  @IsNumber()
  minDataVolume?: number;
  @IsOptional()
  @TransformToInt()
  @IsNumber()
  maxDataVolume?: number;

  // Location filtering
  @IsOptional()
  @TransformToFloat()
  @IsNumber()
  minLat?: number;
  @IsOptional()
  @TransformToFloat()
  @IsNumber()
  maxLat?: number;
  @IsOptional()
  @TransformToFloat()
  @IsNumber()
  minLon?: number;
  @IsOptional()
  @TransformToFloat()
  @IsNumber()
  maxLon?: number;

  // Sorting options
  @IsOptional() @IsString() sortBy?: string; // 'time', 'deviceId', 'dataLength', 'dataVolume', 'createdAt'
  @IsOptional() @IsIn(['asc', 'desc']) sortOrder?: 'asc' | 'desc';

  // Search options
  @IsOptional() @IsString() search?: string; // Search in deviceId
}

// DEPRECATED: Use SignalDto from signal.dto.ts instead
export class SignalResponseDto {
  _id!: string;
  deviceId!: string;
  time!: Date;
  dataLength!: number;
  dataVolume!: number;
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
    coordinates: [number, number];
  };
  createdAt!: Date;
  updatedAt!: Date;
}

// Re-export canonical types for easy migration
export {
  CreateSignalDto as CanonicalCreateSignalDto,
  DataPoint,
  SignalDto,
  BaseQuerySignalsDto,
  ExtendedQuerySignalsDto,
} from './signal.dto';
