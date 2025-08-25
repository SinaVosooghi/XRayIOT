import { Controller, Post, Get, Delete, Body, Query } from '@nestjs/common';
import { ProducerService } from './producer.service';
import { TestDataGeneratorService } from './test-data-generator.service';
import { DataPoint } from '@iotp/shared-types';
import { LegacyXRayPayload } from './producer.types';
import { HealthCheckResult, ProducerMetrics, TestFormat } from './producer.types';

@Controller('test')
export class TestController {
  constructor(
    private readonly producerService: ProducerService,
    private readonly testDataGenerator: TestDataGeneratorService
  ) {}

  @Post('publish/sample')
  async publishSampleData(): Promise<{ success: boolean; message: string }> {
    try {
      await this.producerService.sendTestData();
      return { success: true, message: 'Sample test data published successfully' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: `Failed to publish sample data: ${errorMessage}` };
    }
  }

  @Post('publish/message')
  async publishMessage(
    @Body() data: LegacyXRayPayload
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.producerService.publishMessage(data);
      return { success: result.success, message: 'Message published successfully' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: `Failed to publish message: ${errorMessage}` };
    }
  }

  @Post('send-batch')
  async sendBatchData(
    @Body() messages: LegacyXRayPayload[]
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.producerService.publishBatch(messages);
      return {
        success: result.failedPublishes === 0,
        message: `Batch of ${messages.length} messages processed. ${result.successfulPublishes} successful, ${result.failedPublishes} failed.`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: `Failed to send batch data: ${errorMessage}` };
    }
  }

  @Post('start-continuous')
  startContinuousTesting(@Query('interval') interval?: string): {
    success: boolean;
    message: string;
  } {
    try {
      const intervalMs = interval ? parseInt(interval, 10) : 10000;
      this.producerService.startContinuousTesting({ intervalMs });
      return { success: true, message: `Continuous testing started with ${intervalMs}ms interval` };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: `Failed to start continuous testing: ${errorMessage}` };
    }
  }

  @Post('stop-continuous')
  stopContinuousTesting(): { success: boolean; message: string } {
    try {
      this.producerService.stopContinuousTesting();
      return { success: true, message: 'Continuous testing stopped' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: `Failed to stop continuous testing: ${errorMessage}` };
    }
  }

  @Get('status')
  getStatus(): {
    isRunning: boolean;
    message: string;
  } {
    try {
      const isRunning = this.producerService.isContinuousTestingRunning();

      return {
        isRunning,
        message: isRunning ? 'Continuous testing is running' : 'Continuous testing is stopped',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        isRunning: false,
        message: `Error getting status: ${errorMessage}`,
      };
    }
  }

  @Get('test-formats')
  getTestFormats(): { success: boolean; data: TestFormat[]; message: string } {
    try {
      const formats = this.testDataGenerator.generateAllTestFormats();
      return {
        success: true,
        data: formats,
        message: `Generated ${formats.length} test formats`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        data: [],
        message: `Failed to generate test formats: ${errorMessage}`,
      };
    }
  }

  @Get('random-data')
  getRandomData(): {
    success: boolean;
    data: Record<string, { data: DataPoint[]; time: number }> | null;
    message: string;
  } {
    try {
      const randomData = this.testDataGenerator.generateRandomTestData();
      return {
        success: true,
        data: randomData,
        message: 'Random test data generated successfully',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        data: null,
        message: `Failed to generate random data: ${errorMessage}`,
      };
    }
  }

  @Get('metrics')
  getMetrics(): { success: boolean; data: ProducerMetrics | null; message: string } {
    try {
      const metrics = this.producerService.getMetrics();
      return {
        success: true,
        data: metrics,
        message: 'Producer metrics retrieved successfully',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        data: null,
        message: `Failed to get metrics: ${errorMessage}`,
      };
    }
  }

  @Get('health')
  getHealth(): { success: boolean; data: HealthCheckResult | null; message: string } {
    try {
      const health = this.producerService.getHealthCheck();
      return {
        success: true,
        data: health,
        message: 'Health check completed successfully',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        data: null,
        message: `Failed to get health status: ${errorMessage}`,
      };
    }
  }

  @Delete('clear')
  clearTestData(): { success: boolean; message: string } {
    try {
      // Stop continuous testing if running
      if (this.producerService.isContinuousTestingRunning()) {
        this.producerService.stopContinuousTesting();
      }

      return { success: true, message: 'Test data cleared and continuous testing stopped' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: `Failed to clear test data: ${errorMessage}` };
    }
  }
}
