import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
  CreateSignalDto as BaseCreateSignalDto,
  DataPoint as BaseDataPoint,
} from '@iotp/shared-types';

// API-specific DataPoint with Swagger decorators
export class DataPointDto implements BaseDataPoint {
  @ApiProperty({ description: 'Timestamp in milliseconds' })
  @IsNumber()
  timestamp!: number;

  @ApiProperty({ description: 'Latitude' })
  @IsNumber()
  lat!: number;

  @ApiProperty({ description: 'Longitude' })
  @IsNumber()
  lon!: number;

  @ApiProperty({ description: 'Speed in km/h' })
  @IsNumber()
  speed!: number;
}

// API-specific CreateSignalDto with Swagger decorators
export class CreateSignalDto {
  @ApiProperty({ description: 'Device ID' })
  @IsString()
  deviceId!: string;

  @ApiProperty({ description: 'Array of data points', type: [DataPointDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DataPointDto)
  data!: DataPointDto[];

  @ApiProperty({ description: 'Timestamp in milliseconds' })
  @IsNumber()
  time!: number;

  @ApiProperty({ description: 'Raw data reference', required: false })
  @IsOptional()
  @IsString()
  rawRef?: string;

  // Method to convert to base interface
  toBaseDto(): BaseCreateSignalDto {
    return {
      deviceId: this.deviceId,
      time: this.time,
      data: this.data,
      rawRef: this.rawRef,
    };
  }
}
