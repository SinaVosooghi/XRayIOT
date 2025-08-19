import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class DataPointDto {
  @ApiProperty({ description: 'Timestamp in milliseconds' })
  @IsNumber()
  timestamp!: number;

  @ApiProperty({ description: 'Array of [latitude, longitude, speed]', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  coordinates!: [number, number, number];
}

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

  @ApiProperty({ description: 'Idempotency key', required: false })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
