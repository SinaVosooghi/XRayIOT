import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@iotp/shared-config';

@Injectable()
export class DlqReplayService {
  private readonly logger = new Logger(DlqReplayService.name);

  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly configService: ConfigService
  ) {}

  async replayDLQ(limit: number = 100): Promise<{ replayed: number; failed: number }> {
    const channel = this.amqpConnection.channel;
    let replayed = 0;
    let failed = 0;

    try {
      // Get messages from DLQ
      for (let i = 0; i < limit; i++) {
        const msg = await channel.get('xray.raw.v1.dlq');
        if (!msg) break;

        try {
          // Parse message headers
          const headers = msg.properties.headers || {};
          const retryCount = (headers['x-retry-count'] as number) || 0;
          const maxRetries = this.configService.rabbitmq.retryMax || 3;

          if (retryCount < maxRetries) {
            // Calculate backoff delay
            const delay = Math.min(60000 * Math.pow(2, retryCount), 300000); // Max 5 minutes

            // Publish to retry queue with delay
            channel.publish('iot.xray.dlx', 'xray.raw.v1.retry', msg.content, {
              headers: {
                ...headers,
                'x-retry-count': retryCount + 1,
                'x-retry-delay': delay,
              },
            });

            channel.ack(msg);
            replayed++;
            this.logger.log(`Replayed message ${i + 1} with retry count ${retryCount + 1}`);
          } else {
            // Max retries exceeded, keep in DLQ
            channel.nack(msg, false, false);
            failed++;
            this.logger.warn(`Message ${i + 1} exceeded max retries, keeping in DLQ`);
          }
        } catch (error) {
          this.logger.error(`Error replaying message ${i + 1}:`, error);
          channel.nack(msg, false, false);
          failed++;
        }
      }
    } catch (error) {
      this.logger.error('Error in DLQ replay:', error);
    }

    return { replayed, failed };
  }

  async getDLQStats(): Promise<{ count: number; oldestMessage: Date | null }> {
    const channel = this.amqpConnection.channel;

    try {
      const queueInfo = await channel.checkQueue('xray.raw.v1.dlq');
      const count = queueInfo.messageCount;

      // Get oldest message timestamp
      let oldestMessage: Date | null = null;
      if (count > 0) {
        const msg = await channel.get('xray.raw.v1.dlq', { noAck: true });
        if (msg) {
          const timestamp = msg.properties.timestamp as number | undefined;
          oldestMessage = timestamp ? new Date(timestamp) : null;
          channel.nack(msg, false, false);
        }
      }

      return { count, oldestMessage };
    } catch (error) {
      this.logger.error('Error getting DLQ stats:', error);
      return { count: 0, oldestMessage: null };
    }
  }
}
