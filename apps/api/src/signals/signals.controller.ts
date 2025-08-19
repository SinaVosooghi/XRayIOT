import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  Delete,
  Patch,
  Res,
} from '@nestjs/common';
import { SignalsService } from './signals.service';
import { ApiTags, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { Response } from 'express';
import {
  QuerySignalsDto,
  CreateSignalDto,
  SignalResponseDto,
} from '../../../../libs/shared-types/src';
import { DeviceStatsQuery, LocationClustersQuery, TimeTrendsQuery } from './types';

@ApiTags('signals')
@Controller('signals')
export class SignalsController {
  constructor(private readonly svc: SignalsService) {}

  @Get()
  @ApiQuery({ name: 'deviceId', required: false, description: 'Filter by device ID' })
  @ApiQuery({ name: 'from', required: false, description: 'ISO8601 start time' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO8601 end time' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max 100' })
  @ApiQuery({ name: 'cursor', required: false, description: 'ObjectId or timestamp' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({
    name: 'fields',
    required: false,
    description: 'Comma separated projection e.g. deviceId,time,stats.maxSpeed',
  })

  // Enhanced filtering options
  @ApiQuery({ name: 'minDataLength', required: false, description: 'Minimum data length' })
  @ApiQuery({ name: 'maxDataLength', required: false, description: 'Maximum data length' })
  @ApiQuery({ name: 'minDataVolume', required: false, description: 'Minimum data volume in bytes' })
  @ApiQuery({ name: 'maxDataVolume', required: false, description: 'Maximum data volume in bytes' })

  // Location filtering
  @ApiQuery({ name: 'minLat', required: false, description: 'Minimum latitude' })
  @ApiQuery({ name: 'maxLat', required: false, description: 'Maximum latitude' })
  @ApiQuery({ name: 'minLon', required: false, description: 'Minimum longitude' })
  @ApiQuery({ name: 'maxLon', required: false, description: 'Maximum longitude' })

  // Sorting options
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort by: time, deviceId, dataLength, dataVolume, createdAt',
  })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order: asc or desc' })

  // Search options
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in deviceId (case-insensitive)',
  })
  @ApiOkResponse({ type: [SignalResponseDto] })
  async findAll(@Query() q: QuerySignalsDto) {
    return this.svc.findAll(q);
  }

  @Get(':id')
  @ApiOkResponse({ type: SignalResponseDto })
  async findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Get(':id/raw')
  async streamRaw(@Param('id') id: string, @Res() res: Response) {
    // First get the signal to find the rawRef
    const signal = await this.svc.findOne(id);
    if (!signal.rawRef) {
      throw new BadRequestException('Raw data not found for this signal');
    }
    return this.svc.streamRawData(signal.rawRef, res);
  }

  @Get(':id/raw/metadata')
  async getRawMetadata(@Param('id') id: string) {
    // First get the signal to find the rawRef
    const signal = await this.svc.findOne(id);
    if (!signal.rawRef) {
      throw new BadRequestException('Raw data not found for this signal');
    }
    return this.svc.getRawMetadata(signal.rawRef);
  }

  @Post()
  @ApiOkResponse({ type: SignalResponseDto })
  async create(@Body() body: CreateSignalDto) {
    return this.svc.create(body);
  }

  @Patch(':id')
  @ApiOkResponse({ type: SignalResponseDto })
  async update(@Param('id') id: string, @Body() body: Partial<CreateSignalDto>) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }

  @Get('storage/stats')
  async getStorageStats() {
    return this.svc.getStorageStats();
  }

  @Get('analytics/device-stats')
  @ApiQuery({ name: 'deviceId', required: false, description: 'Filter by device ID' })
  @ApiQuery({ name: 'from', required: false, description: 'ISO8601 start time' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO8601 end time' })
  @ApiOkResponse({ description: 'Device statistics and analytics' })
  async getDeviceStats(@Query() query: DeviceStatsQuery) {
    return this.svc.getDeviceStats(query);
  }

  @Get('analytics/location-clusters')
  @ApiQuery({ name: 'from', required: false, description: 'ISO8601 start time' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO8601 end time' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of clusters to return' })
  @ApiOkResponse({ description: 'Location clustering analysis' })
  async getLocationClusters(@Query() query: LocationClustersQuery) {
    return this.svc.getLocationClusters(query);
  }

  @Get('analytics/time-trends')
  @ApiQuery({ name: 'deviceId', required: false, description: 'Filter by device ID' })
  @ApiQuery({ name: 'from', required: false, description: 'ISO8601 start time' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO8601 end time' })
  @ApiQuery({
    name: 'interval',
    required: false,
    description: 'Time interval: hour, day, week, month',
  })
  @ApiOkResponse({ description: 'Time-based trends and patterns' })
  async getTimeTrends(@Query() query: TimeTrendsQuery) {
    return this.svc.getTimeTrends(query);
  }
}
