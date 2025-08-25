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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SignalsService } from './signals.service';
import { CreateSignalDto, UpdateSignalDto } from './dto/index';
import {
  BaseQuerySignalsDto,
  SignalDto,
  XRaySignalsPayload,
  Paginated,
  DataPoint,
} from '@iotp/shared-types';

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

    // Convert the new DTO format to the service-expected format
    const servicePayload: XRaySignalsPayload = {
      deviceId: body.deviceId,
      time: body.time,
      data: body.data.map((point: DataPoint) => [
        point.timestamp,
        [point.lat, point.lon, point.speed],
      ]),
    };
    return this.svc.create(servicePayload);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing signal' })
  @ApiResponse({ status: 200, description: 'Signal updated successfully' })
  @ApiResponse({ status: 404, description: 'Signal not found' })
  async update(@Param('id') id: string, @Body() body: UpdateSignalDto): Promise<SignalDto> {
    // Convert the new DTO format to the service-expected format
    const servicePayload: Partial<XRaySignalsPayload> = {
      deviceId: body.deviceId,
      time: body.time,
      data: body.data?.map((point: DataPoint) => [
        point.timestamp,
        [point.lat, point.lon, point.speed],
      ]),
    };
    return this.svc.update(id, servicePayload);
  }

  @Get()
  @ApiOperation({ summary: 'Get all signals with pagination' })
  @ApiResponse({ status: 200, description: 'Signals retrieved successfully' })
  async findAll(@Query() query: BaseQuerySignalsDto): Promise<Paginated<SignalDto>> {
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
}
