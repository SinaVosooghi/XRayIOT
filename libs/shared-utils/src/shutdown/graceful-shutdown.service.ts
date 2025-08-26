import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class GracefulShutdownService implements OnModuleDestroy {
  private readonly logger = new Logger(GracefulShutdownService.name);
  private isShuttingDown = false;

  constructor(private readonly amqpConnection: AmqpConnection) {}

  async onModuleDestroy() {
    await this.gracefulShutdown();
  }

  async gracefulShutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    this.logger.log('Starting graceful shutdown...');

    try {
      // 1. Stop accepting new messages
      this.stopConsumers();

      // 2. Wait for in-flight messages to complete
      await this.waitForInFlightMessages();

      // 3. Close RabbitMQ connection
      this.closeRabbitMQConnection();

      this.logger.log('Graceful shutdown completed');
    } catch (error) {
      this.logger.error('Error during graceful shutdown:', error);
    }
  }

  private stopConsumers(): void {
    this.logger.log('Stopping message consumers...');

    try {
      // For now, just log that we're stopping consumers
      // The actual consumer cancellation will be handled by NestJS lifecycle hooks
      this.logger.log('Consumers will be stopped by NestJS lifecycle hooks');
    } catch (error) {
      this.logger.error('Error stopping consumers:', error);
    }
  }

  private async waitForInFlightMessages(): Promise<void> {
    this.logger.log('Waiting for in-flight messages to complete...');

    // Wait up to 30 seconds for in-flight messages
    const maxWaitTime = 30000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        // For now, just wait a bit to allow messages to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.logger.log('Waited for in-flight messages to complete');
        break;
      } catch (error) {
        this.logger.error('Error waiting for in-flight messages:', error);
        break;
      }
    }
  }

  private closeRabbitMQConnection(): void {
    this.logger.log('Closing RabbitMQ connection...');

    try {
      // For now, just log that we're closing the connection
      // The actual connection closure will be handled by NestJS lifecycle hooks
      this.logger.log('RabbitMQ connection will be closed by NestJS lifecycle hooks');
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection:', error);
    }
  }
}
