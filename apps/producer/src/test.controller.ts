import { Controller, Post, Get, Query, Body, Logger } from '@nestjs/common';
import { ProducerService } from './producer.service';
import { TestDataGeneratorService } from './test-data-generator.service';
import { XRayRawSignal, DeviceStatusUpdate } from '@iotp/shared-messaging';

@Controller('test')
export class TestController {
  private readonly logger = new Logger(TestController.name);

  constructor(
    private readonly producerService: ProducerService,
    private readonly testDataGenerator: TestDataGeneratorService
  ) {}

  @Post('send-message')
  async sendTestMessage(): Promise<{ success: boolean; message: string }> {
    try {
      const testData = this.testDataGenerator.generateRawSignal();
      await this.producerService.publishMessage(testData);

      this.logger.log('Test message sent successfully', {
        deviceId: testData.deviceId,
        schemaVersion: testData.schemaVersion,
      });

      return {
        success: true,
        message: `Test message sent for device ${testData.deviceId}`,
      };
    } catch (error) {
      this.logger.error('Failed to send test message', { error: error.message });
      throw error;
    }
  }

  @Post('send-batch')
  async sendTestBatch(
    @Query('count') count: number = 5
  ): Promise<{ success: boolean; message: string }> {
    try {
      const testData = this.testDataGenerator.generateRawSignals(count);
      await this.producerService.publishBatch(testData);

      this.logger.log('Test batch sent successfully', {
        count: testData.length,
        deviceIds: testData.map(d => d.deviceId),
      });

      return {
        success: true,
        message: `Test batch of ${count} messages sent successfully`,
      };
    } catch (error) {
      this.logger.error('Failed to send test batch', { error: error.message, count });
      throw error;
    }
  }

  @Post('send-device-status')
  async sendDeviceStatus(
    @Body() statusData: { deviceId: string; status: string; health?: any }
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.producerService.publishDeviceStatus(
        statusData.deviceId,
        statusData.status,
        statusData.health
      );

      this.logger.log('Device status sent successfully', {
        deviceId: statusData.deviceId,
        status: statusData.status,
      });

      return {
        success: true,
        message: `Device status sent for ${statusData.deviceId}`,
      };
    } catch (error) {
      this.logger.error('Failed to send device status', {
        error: error.message,
        deviceId: statusData.deviceId,
      });
      throw error;
    }
  }

  @Post('send-random-device-status')
  async sendRandomDeviceStatus(): Promise<{ success: boolean; message: string }> {
    try {
      const testStatus = this.testDataGenerator.generateDeviceStatus();
      await this.producerService.publishDeviceStatus(
        testStatus.deviceId,
        testStatus.status,
        testStatus.health
      );

      this.logger.log('Random device status sent successfully', {
        deviceId: testStatus.deviceId,
        status: testStatus.status,
      });

      return {
        success: true,
        message: `Random device status sent for ${testStatus.deviceId}`,
      };
    } catch (error) {
      this.logger.error('Failed to send random device status', { error: error.message });
      throw error;
    }
  }

  @Post('validate-message')
  async validateMessage(
    @Body() message: any
  ): Promise<{ valid: boolean; errors?: string[]; message: string }> {
    try {
      const validation = await this.producerService.validateMessage(message);

      if (validation.valid) {
        return {
          valid: true,
          message: 'Message is valid according to JSON Schema',
        };
      } else {
        return {
          valid: false,
          errors: validation.errors,
          message: 'Message validation failed',
        };
      }
    } catch (error) {
      this.logger.error('Message validation error', { error: error.message });
      throw error;
    }
  }

  @Get('generate-test-data')
  async generateTestData(
    @Query('type') type: string = 'raw',
    @Query('count') count: number = 1
  ): Promise<any> {
    try {
      switch (type) {
        case 'raw':
          return count === 1
            ? this.testDataGenerator.generateRawSignal()
            : this.testDataGenerator.generateRawSignals(count);

        case 'processed':
          return count === 1
            ? this.testDataGenerator.generateProcessedSignal()
            : this.testDataGenerator.generateProcessedSignals(count);

        case 'status':
          return count === 1
            ? this.testDataGenerator.generateDeviceStatus()
            : this.testDataGenerator.generateDeviceStatuses(count);

        case 'invalid':
          return this.testDataGenerator.generateInvalidRawSignal();

        case 'edge-case':
          return this.testDataGenerator.generateEdgeCaseRawSignal();

        default:
          return {
            error: 'Invalid type. Use: raw, processed, status, invalid, or edge-case',
            availableTypes: ['raw', 'processed', 'status', 'invalid', 'edge-case'],
          };
      }
    } catch (error) {
      this.logger.error('Failed to generate test data', { error: error.message, type, count });
      throw error;
    }
  }

  @Post('test-validation')
  async testValidation(): Promise<{ success: boolean; results: any[] }> {
    try {
      const testCases = [
        {
          name: 'Valid Raw Signal',
          data: this.testDataGenerator.generateRawSignal(),
          expected: true,
        },
        {
          name: 'Invalid Raw Signal',
          data: this.testDataGenerator.generateInvalidRawSignal(),
          expected: false,
        },
        {
          name: 'Edge Case Raw Signal',
          data: this.testDataGenerator.generateEdgeCaseRawSignal(),
          expected: true,
        },
        {
          name: 'Valid Device Status',
          data: this.testDataGenerator.generateDeviceStatus(),
          expected: true,
        },
      ];

      const results = await Promise.all(
        testCases.map(async testCase => {
          try {
            let validation;
            if (testCase.name.includes('Raw Signal')) {
              validation = await this.producerService.validateRawSignal(testCase.data);
            } else if (testCase.name.includes('Device Status')) {
              validation = await this.producerService.validateDeviceStatus(testCase.data);
            } else {
              validation = { valid: false, errors: ['Unknown test case type'] };
            }

            return {
              name: testCase.name,
              expected: testCase.expected,
              actual: validation.valid,
              passed: validation.valid === testCase.expected,
              errors: validation.errors || [],
            };
          } catch (error) {
            return {
              name: testCase.name,
              expected: testCase.expected,
              actual: 'error',
              passed: false,
              errors: [error.message],
            };
          }
        })
      );

      const passedCount = results.filter(r => r.passed).length;
      const totalCount = results.length;

      this.logger.log('Validation test completed', {
        passed: passedCount,
        total: totalCount,
        success: passedCount === totalCount,
      });

      return {
        success: passedCount === totalCount,
        results,
      };
    } catch (error) {
      this.logger.error('Validation test failed', { error: error.message });
      throw error;
    }
  }
}
