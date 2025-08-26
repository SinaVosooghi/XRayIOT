import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    ConfigModule,
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
            {
              name: 'iot.xray.dlx',
              type: 'direct',
            },
          ],
          uri,
          connectionInitOptions: { wait: false },
          enableControllerDiscovery: true,
          prefetchCount: configService.get<number>('RABBITMQ_PREFETCH') || 10,
        };
      },
    }),
  ],
  exports: [RabbitMQModule],
})
export class RmqModule {}
