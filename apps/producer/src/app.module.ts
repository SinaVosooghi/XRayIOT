import { Module } from '@nestjs/common';
import { ConfigModule } from '@iotp/shared-config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ProducerService } from './producer.service';
import { TestController } from './test.controller';
import { TestDataGeneratorService } from './test-data-generator.service';
import { HmacAuthService, NonceTrackerService } from '@iotp/shared-utils';

@Module({
  imports: [
    ConfigModule,
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      useFactory: () => ({
        exchanges: [
          {
            name: 'iot.xray',
            type: 'topic',
          },
        ],
        uri: process.env.RABBITMQ_URI || 'amqp://admin:password@localhost:5672',
        connectionInitOptions: { wait: false },
        enableControllerDiscovery: true,
      }),
    }),
  ],
  controllers: [TestController],
  providers: [
    ProducerService,
    TestDataGeneratorService,
    HmacAuthService,
    NonceTrackerService,
  ],
})
export class AppModule {}
