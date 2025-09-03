import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  Delete,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SignalsService } from './signals.service';
import { CreateSignalDto, UpdateSignalDto } from './dto/index';
import { SignalDto, Paginated } from '@iotp/shared-types';
import { QuerySignalsDto } from './dto/query-signals.dto';

@ApiTags('signals')
@Controller('signals')
export class SignalsController {
  constructor(private readonly svc: SignalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new signal' })
  @ApiResponse({ status: 201, description: 'Signal created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() body: CreateSignalDto): Promise<SignalDto> {
    // Validate that data is an array before processing
    if (!Array.isArray(body.data)) {
      throw new Error('Validation failed: data must be an array');
    }

    // Pass the DTO directly to the service
    return this.svc.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing signal' })
  @ApiResponse({ status: 200, description: 'Signal updated successfully' })
  @ApiResponse({ status: 404, description: 'Signal not found' })
  async update(@Param('id') id: string, @Body() body: UpdateSignalDto): Promise<SignalDto> {
    // Pass the DTO directly to the service
    return this.svc.update(id, body);
  }

  @Get()
  @ApiOperation({ summary: 'Get all signals with pagination' })
  @ApiResponse({ status: 200, description: 'Signals retrieved successfully' })
  async findAll(@Query() query: QuerySignalsDto): Promise<Paginated<SignalDto>> {
    return this.svc.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a signal by ID' })
  @ApiResponse({ status: 200, description: 'Signal retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Signal not found' })
  async findOne(@Param('id') id: string): Promise<SignalDto> {
    const signal = await this.svc.findOne(id);
    if (!signal) {
      throw new NotFoundException(`Signal with ID ${id} not found`);
    }
    return signal;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a signal' })
  @ApiResponse({ status: 200, description: 'Signal deleted successfully' })
  @ApiResponse({ status: 404, description: 'Signal not found' })
  async remove(@Param('id') id: string): Promise<{ deleted: boolean }> {
    const result = await this.svc.remove(id);
    return { deleted: result };
  }

  @Get(':id/raw/metadata')
  @ApiOperation({ summary: 'Get raw data metadata for a signal' })
  @ApiResponse({ status: 200, description: 'Raw metadata retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Signal or raw data not found' })
  async getRawMetadata(
    @Param('id') id: string
  ): Promise<{ filename: string; size?: number; length?: number }> {
    // First get the signal to get the rawRef
    const signal = await this.svc.findOne(id);
    if (!signal) {
      throw new NotFoundException(`Signal with ID ${id} not found`);
    }

    if (!signal.rawRef) {
      throw new NotFoundException(`No raw data found for signal ${id}`);
    }

    // Get the raw metadata using the rawRef
    return this.svc.getRawMetadata(signal.rawRef);
  }

  @Get(':id/raw')
  @ApiOperation({ summary: 'Get raw data for a signal' })
  @ApiResponse({ status: 200, description: 'Raw data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Signal or raw data not found' })
  async getRawData(@Param('id') id: string, @Res() res: Response): Promise<void> {
    // First get the signal to get the rawRef
    const signal = await this.svc.findOne(id);
    if (!signal) {
      throw new NotFoundException(`Signal with ID ${id} not found`);
    }

    if (!signal.rawRef) {
      throw new NotFoundException(`No raw data found for signal ${id}`);
    }

    // Get the raw data using the rawRef
    const rawData = await this.svc.getRawData(signal.rawRef);

    // Set appropriate headers for binary data
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', rawData.length.toString());

    // Send the raw data
    res.send(rawData);
  }
}
