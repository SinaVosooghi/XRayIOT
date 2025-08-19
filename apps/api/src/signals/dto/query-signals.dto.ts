import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QuerySignalsDto {
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
}
