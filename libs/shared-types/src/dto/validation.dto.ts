/**
 * Centralized Validation DTOs
 *
 * This file contains all validation DTOs used across the application.
 * All services should use these DTOs to ensure consistent validation.
 */

import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsDateString,
  IsEnum,
  IsObject,
  ValidateNested,
  Min,
  Max,
  Length,
  Matches,
  IsInt,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

// Base validation DTOs
export class BaseValidationDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  correlationId?: string;
}

// Pagination DTOs
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// Time range DTOs
export class TimeRangeDto {
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;
}

// Coordinate validation DTOs
export class CoordinateDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsOptional()
  @IsNumber()
  altitude?: number;
}

// Device validation DTOs
export class DeviceMetadataDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinateDto)
  location?: CoordinateDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  battery?: number;

  @IsOptional()
  @IsNumber()
  @Min(-120)
  @Max(0)
  signalStrength?: number;

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  uptime?: number;
}

// Data point validation DTOs
export class DataPointDto {
  @IsNumber()
  @IsPositive()
  timestamp!: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lon!: number;

  @IsNumber()
  @Min(0)
  speed!: number;
}

// Signal validation DTOs
export class CreateSignalDto extends BaseValidationDto {
  @IsString()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Device ID must contain only alphanumeric characters, underscores, and hyphens',
  })
  deviceId!: string;

  @IsNumber()
  @IsPositive()
  time!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DataPointDto)
  data!: DataPointDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => DeviceMetadataDto)
  metadata?: DeviceMetadataDto;
}

export class UpdateSignalDto extends BaseValidationDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  deviceId?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  time?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DataPointDto)
  data?: DataPointDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => DeviceMetadataDto)
  metadata?: DeviceMetadataDto;
}

// Query validation DTOs
export class QuerySignalsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  deviceId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TimeRangeDto)
  timeRange?: TimeRangeDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minSpeed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxSpeed?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinateDto)
  location?: CoordinateDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minBattery?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxBattery?: number;
}

// Device status validation DTOs
export class DeviceStatusDto extends BaseValidationDto {
  @IsString()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  deviceId!: string;

  @IsEnum(['online', 'offline', 'error', 'maintenance'])
  status!: 'online' | 'offline' | 'error' | 'maintenance';

  @IsDateString()
  lastSeen!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DeviceMetadataDto)
  health?: DeviceMetadataDto;

  @IsOptional()
  @IsObject()
  capabilities?: {
    supportedMessageTypes: string[];
    maxPayloadSize: number;
    supportedProtocols: string[];
  };
}

// Message validation DTOs
export class MessageValidationDto extends BaseValidationDto {
  @IsString()
  @Length(1, 10)
  @Matches(/^v\d+\.\d+$/)
  schemaVersion!: string;

  @IsString()
  @Length(1, 100)
  idempotencyKey!: string;

  @IsString()
  @Length(1, 50)
  messageType!: string;

  @IsDateString()
  createdAt!: string;
}

// Error response DTOs
export class ErrorResponseDto {
  @IsString()
  error!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  correlationId?: string;

  @IsOptional()
  @IsString()
  timestamp?: string;

  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;
}

// Health check DTOs
export class HealthCheckDto {
  @IsString()
  status!: 'healthy' | 'unhealthy' | 'degraded';

  @IsString()
  timestamp!: string;

  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  checks?: string[];
}

// Validation groups for different scenarios
export const ValidationGroups = {
  CREATE: 'create',
  UPDATE: 'update',
  QUERY: 'query',
  MESSAGE: 'message',
} as const;
