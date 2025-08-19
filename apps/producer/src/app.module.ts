import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { configSchema } from '../../../libs/shared-config/src/config.schema';

import { ProducerService } from './producer.service';
import { TestDataGeneratorService } from './test-data-generator.service';
import { TestController } from './test.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configSchema,
      validationOptions: { abortEarly: true },
    }),
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('RABBITMQ_URI');
        if (!uri) {
          throw new Error('RABBITMQ_URI environment variable is required');
        }

        return {
          exchanges: [
            {
              name: configService.get<string>('RABBITMQ_EXCHANGE') || 'iot.xray',
              type: 'topic',
            },
          ],
          uri,
          connectionInitOptions: { wait: false },
          enableControllerDiscovery: true,
        };
      },
    }),
  ],
  controllers: [TestController],
  providers: [ProducerService, TestDataGeneratorService],
})
export class AppModule {}
