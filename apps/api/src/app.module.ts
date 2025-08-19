import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { SharedConfigModule, ConfigService } from '../../../libs/shared-config/src';
import { SignalsModule } from './signals/signals.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    SharedConfigModule,
    MongooseModule.forRootAsync({
      imports: [SharedConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.database.uri,
        dbName: configService.database.dbName,
        connectionFactory: (connection: Connection) => {
          connection.on('error', (err: Error) => console.error('Mongo connection error:', err));
          connection.on('disconnected', () => console.warn('Mongo connection lost'));
          connection.on('reconnected', () => console.info('Mongo reconnected'));
          return connection;
        },
      }),
    }),
    SignalsModule,
    HealthModule,
  ],
})
export class AppModule {}
