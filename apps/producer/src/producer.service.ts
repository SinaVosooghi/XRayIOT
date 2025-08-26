import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { TestDataGeneratorService } from './test-data-generator.service';
import { LegacyXRayPayload } from './producer.types';
import { v4 as uuidv4 } from 'uuid';
import {
  PublishOptions,
  PublishResult,
  BatchPublishResult,
  ContinuousTestingConfig,
  ContinuousTestingStatus,
  ProducerMetrics,
  HealthCheckResult,
  IProducerService,
} from './producer.types';

@Injectable()
export class ProducerService implements IProducerService {
  private readonly logger = new Logger(ProducerService.name);
  private isRunning = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private startTime?: Date;
  private messagesSent = 0;
  private errors = 0;
  private lastError?: string;
  private lastMessageTime?: Date;
  private publishTimes: number[] = [];

  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly testDataGenerator: TestDataGeneratorService
  ) {}

  async sendTestData(): Promise<void> {
    try {
      const testData = this.testDataGenerator.generateOriginalFormat();
      await this.publishMessage(testData);
      this.logger.log('Test data sent successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send test data: ${errorMessage}`);
      throw error;
    }
  }

  async publishMessage(
    message: LegacyXRayPayload,
    options?: Partial<PublishOptions>
  ): Promise<PublishResult> {
    const startTime = Date.now();
    try {
      const exchange = options?.exchange || 'iot.xray';
      const routingKey = options?.routingKey || 'xray.raw.v1';
      const correlationId = this.generateCorrelationId();

      await this.amqpConnection.publish(exchange, routingKey, message, {
        headers: {
          'x-correlation-id': correlationId,
          'x-timestamp': new Date().toISOString(),
          'x-service': 'producer',
        },
      });

      const publishTime = Date.now() - startTime;
      this.publishTimes.push(publishTime);
      this.messagesSent++;
      this.lastMessageTime = new Date();

      this.logger.log(`Message published to ${exchange} with routing key ${routingKey}`);

      return {
        success: true,
        timestamp: Date.now(),
        exchange,
        routingKey,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to publish message: ${errorMessage}`);
      this.errors++;
      this.lastError = errorMessage;

      throw error;
    }
  }

  async publishBatch(
    messages: LegacyXRayPayload[],
    options?: Partial<PublishOptions>
  ): Promise<BatchPublishResult> {
    const result: BatchPublishResult = {
      totalMessages: messages.length,
      successfulPublishes: 0,
      failedPublishes: 0,
      errors: [],
    };

    const exchange = options?.exchange || 'iot.xray';
    const routingKey = options?.routingKey || 'xray.raw.v1';

    for (const message of messages) {
      try {
        const correlationId = this.generateCorrelationId();
        await this.amqpConnection.publish(exchange, routingKey, message, {
          headers: {
            'x-correlation-id': correlationId,
            'x-timestamp': new Date().toISOString(),
            'x-service': 'producer',
          },
        });
        result.successfulPublishes++;
        this.messagesSent++;
        this.lastMessageTime = new Date();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.failedPublishes++;
        result.errors.push({
          message,
          error: errorMessage,
          timestamp: Date.now(),
        });
        this.errors++;
        this.lastError = errorMessage;
      }
    }

    this.logger.log(
      `Published ${result.successfulPublishes}/${result.totalMessages} messages in batch`
    );
    return result;
  }

  startContinuousTesting(config?: Partial<ContinuousTestingConfig>): void {
    if (this.isRunning) {
      this.logger.warn('Continuous testing is already running');
      return;
    }

    const intervalMs = config?.intervalMs || 10000;
    this.isRunning = true;
    this.startTime = new Date();
    this.intervalId = setInterval(() => {
      this.sendTestData().catch(error => {
        this.logger.error('Error in continuous testing:', error);
        this.errors++;
        this.lastError = error instanceof Error ? error.message : 'Unknown error';

        if (config?.stopOnError) {
          this.stopContinuousTesting();
        }
      });
    }, intervalMs);

    this.logger.log(`Started continuous testing with ${intervalMs}ms interval`);
  }

  stopContinuousTesting(): void {
    if (!this.isRunning) {
      this.logger.warn('Continuous testing is not running');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    this.logger.log('Stopped continuous testing');
  }

  isContinuousTestingRunning(): boolean {
    return this.isRunning;
  }

  async processBatch(messages: LegacyXRayPayload[]): Promise<void> {
    try {
      await this.publishBatch(messages);
      this.logger.log(`Processed batch of ${messages.length} messages`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to process batch: ${errorMessage}`);
      throw error;
    }
  }

  getContinuousTestingStatus(): ContinuousTestingStatus {
    return {
      isRunning: this.isRunning,
      startTime: this.startTime,
      messagesSent: this.messagesSent,
      errors: this.errors,
      lastError: this.lastError,
      lastMessageTime: this.lastMessageTime,
      intervalId: this.intervalId,
    };
  }

  getMetrics(): ProducerMetrics {
    const averagePublishTime =
      this.publishTimes.length > 0
        ? this.publishTimes.reduce((sum, time) => sum + time, 0) / this.publishTimes.length
        : 0;

    return {
      messagesPublished: this.messagesSent,
      messagesFailed: this.errors,
      averagePublishTime,
      lastPublishTime: this.lastMessageTime,
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
      errors: this.lastError
        ? [
            {
              type: 'publish_error',
              count: this.errors,
              lastOccurrence: this.lastMessageTime || new Date(),
            },
          ]
        : [],
    };
  }

  getHealthCheck(): HealthCheckResult {
    const amqpConnection = this.amqpConnection.connected;
    const messagePublishing = this.messagesSent > 0 || this.errors === 0;
    const continuousTesting = !this.isRunning || this.errors < 10;

    const status =
      amqpConnection && messagePublishing && continuousTesting
        ? 'healthy'
        : amqpConnection && messagePublishing
          ? 'degraded'
          : 'unhealthy';

    return {
      status,
      checks: {
        amqpConnection,
        messagePublishing,
        continuousTesting,
      },
      details: {
        amqpConnection: amqpConnection ? 'Connected' : 'Disconnected',
        messagePublishing: messagePublishing ? 'Working' : 'Failing',
        continuousTesting: continuousTesting ? 'Stable' : 'Unstable',
      },
    };
  }

  private generateCorrelationId(): string {
    return uuidv4();
  }
}
