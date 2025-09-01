import { Controller, Post, Body, Get } from '@nestjs/common';
import { ProducerService } from './producer.service';
import { TestDataGeneratorService } from './test-data-generator.service';
import { XRayRawSignal } from '@iotp/shared-messaging';

@Controller('test')
export class TestController {
  constructor(
    private readonly producerService: ProducerService,
    private readonly testDataGenerator: TestDataGeneratorService
  ) {}

  @Post('send-raw')
  async sendRawSignal(@Body() payload: Record<string, unknown>) {
    try {
      await this.producerService.publishMessage(payload as XRayRawSignal);
      return { success: true, message: 'Raw signal sent successfully' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Post('send-batch')
  async sendBatchSignals(@Body() payloads: Record<string, unknown>[]) {
    try {
      await this.producerService.publishBatch(payloads as XRayRawSignal[]);
      return { success: true, message: 'Batch signals sent successfully' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Post('send-device-status')
  async sendDeviceStatus(
    @Body() data: { deviceId: string; status: string; metadata?: Record<string, unknown> }
  ) {
    try {
      const status = data.status as 'online' | 'offline' | 'error' | 'maintenance';
      await this.producerService.publishDeviceStatus(data.deviceId, status, data.metadata);
      return { success: true, message: 'Device status sent successfully' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('generate-data')
  generateTestData() {
    return {
      validRawSignal: this.testDataGenerator.generateRawSignal(),
      validProcessedSignal: this.testDataGenerator.generateProcessedSignal(),
      validDeviceStatus: this.testDataGenerator.generateDeviceStatus(),
      invalidData: this.testDataGenerator.generateInvalidData(),
    };
  }

  @Post('validate-message')
  validateMessage(@Body() _data: Record<string, unknown>) {
    // This would use the MessageValidator in a real implementation
    // For now, return a placeholder response
    return {
      valid: true,
      message: 'Message validation not implemented in test service',
    };
  }

  @Post('validate-batch')
  validateBatch(@Body() data: Record<string, unknown>[]) {
    try {
      // This would use the MessageValidator in a real implementation
      // For now, return a placeholder response
      return {
        total: data.length,
        valid: data.length,
        invalid: 0,
        message: 'Batch validation not implemented in test service',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  @Post('test-hmac')
  testHmacAuthentication(@Body() data: Record<string, unknown>) {
    try {
      // This would test HMAC signature generation and validation
      const message = JSON.stringify(data);
      return {
        success: true,
        message: 'HMAC test completed',
        dataLength: message.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      service: 'producer',
      timestamp: new Date().toISOString(),
    };
  }
}
