import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get configuration service
  const configService = app.get(ConfigService);

  // Start server on port 3002 as requested
  const port = 3002;
  const host = '0.0.0.0';

  await app.listen(port, host);
  console.log(`🚀 Signals service is running on ${host}:${port}`);
  console.log(`🌍 Environment: ${configService.get<string>('NODE_ENV') || 'development'}`);
}

void bootstrap();
