import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { configSchema } from '../../../libs/shared-config/src/config.schema';
import { XRayModule } from './xray/xray.module';
import { RmqModule } from './rmq/rmq.module';
import { RawModule } from './raw/raw.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configSchema,
      validationOptions: { abortEarly: true },
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        dbName: configService.get<string>('MONGO_DB'),
      }),
    }),
    XRayModule,
    RmqModule,
    RawModule,
  ],
})
export class AppModule {}
