import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { configSchema } from './config.schema';
import { ConfigService as CustomConfigService } from './config.service';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        process.env.NODE_ENV === 'test' ? '.env.test' : '.env.local',
        '.env',
        '.env.example',
      ],
      validationSchema: configSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true,
      },
      cache: true,
      expandVariables: true,
    }),
  ],
  providers: [CustomConfigService],
  exports: [CustomConfigService],
})
export class SharedConfigModule implements OnModuleInit {
  constructor(private readonly configService: CustomConfigService) {}

  onModuleInit() {
    // Skip configuration validation in test environment to avoid requiring real environment variables
    if (process.env.NODE_ENV === 'test' && process.env.SKIP_CONFIG_VALIDATION === 'true') {
      console.log('⏭️ Skipping configuration validation in test environment');
      return;
    }

    try {
      // Validate configuration at startup
      this.configService.validate();

      // Log configuration summary
      console.log('✅ Configuration validated successfully');
      console.log(`🌍 Environment: ${this.configService.nodeEnv}`);
      console.log(`🚀 Port: ${this.configService.port}`);
      console.log(`🗄️ Database: ${this.configService.database.uri}`);
      console.log(`🐰 RabbitMQ: ${this.configService.rabbitmq.uri}`);
      console.log(`🔴 Redis: ${this.configService.redis.uri}`);
      console.log(`💾 Storage: ${this.configService.storage.rawStore}`);
    } catch (error) {
      console.error('❌ Configuration validation failed:', (error as Error).message);
      throw error;
    }
  }
}
