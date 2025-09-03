import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BaseQuerySignalsDto } from '@iotp/shared-types';

// API-specific QuerySignalsDto with Swagger decorators
export class QuerySignalsDto implements BaseQuerySignalsDto {
  @ApiProperty({ description: 'Device ID filter', required: false })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty({ description: 'Start time filter (ISO string)', required: false })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiProperty({ description: 'End time filter (ISO string)', required: false })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiProperty({
    description: 'Number of results to return',
    required: false,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => parseInt(String(value)))
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({
    description: 'Number of results to skip',
    required: false,
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => parseInt(String(value)))
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  skip?: number = 0;

  @ApiProperty({ description: 'Cursor for pagination', required: false })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiProperty({ description: 'Comma-separated list of fields to return', required: false })
  @IsOptional()
  @IsString()
  fields?: string;

  @ApiProperty({ description: 'Minimum latitude for location filtering', required: false })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => parseFloat(String(value)))
  @Type(() => Number)
  @IsNumber()
  minLat?: number;

  @ApiProperty({ description: 'Maximum latitude for location filtering', required: false })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => parseFloat(String(value)))
  @Type(() => Number)
  @IsNumber()
  maxLat?: number;

  @ApiProperty({ description: 'Minimum longitude for location filtering', required: false })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => parseFloat(String(value)))
  @Type(() => Number)
  @IsNumber()
  minLon?: number;

  @ApiProperty({ description: 'Maximum longitude for location filtering', required: false })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => parseFloat(String(value)))
  @Type(() => Number)
  @IsNumber()
  maxLon?: number;

  @ApiProperty({ description: 'Field to sort by', required: false })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ description: 'Sort order (asc or desc)', required: false })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
