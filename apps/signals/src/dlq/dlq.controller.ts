import { Controller, Post, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DlqReplayService } from './dlq-replay.service';

@ApiTags('dlq')
@Controller('dlq')
export class DlqController {
  constructor(private readonly dlqReplayService: DlqReplayService) {}

  @Post('replay')
  @ApiOperation({ summary: 'Replay messages from DLQ' })
  @ApiResponse({ status: 200, description: 'DLQ replay initiated' })
  async replayDLQ(@Query('limit') limit: number = 100) {
    const result = await this.dlqReplayService.replayDLQ(limit);
    return {
      message: 'DLQ replay completed',
      ...result,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get DLQ statistics' })
  @ApiResponse({ status: 200, description: 'DLQ stats retrieved' })
  async getDLQStats() {
    return await this.dlqReplayService.getDLQStats();
  }
}
