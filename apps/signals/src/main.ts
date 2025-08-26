import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { GracefulShutdownService } from '@iotp/shared-utils';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get configuration service
  const configService = app.get(ConfigService);

  // Get graceful shutdown service
  const gracefulShutdownService = app.get(GracefulShutdownService);

  // Handle shutdown signals
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, starting graceful shutdown...');
    gracefulShutdownService
      .gracefulShutdown()
      .then(() => {
        process.exit(0);
      })
      .catch(error => {
        console.error('Error during graceful shutdown:', error);
        process.exit(1);
      });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, starting graceful shutdown...');
    gracefulShutdownService
      .gracefulShutdown()
      .then(() => {
        process.exit(0);
      })
      .catch(error => {
        console.error('Error during graceful shutdown:', error);
        process.exit(1);
      });
  });

  // Start server on port 3002 as requested
  const port = 3002;
  const host = '0.0.0.0';

  await app.listen(port, host);
  console.log(`🚀 Signals service is running on ${host}:${port}`);
  console.log(`🌍 Environment: ${configService.get<string>('NODE_ENV') || 'development'}`);
}

void bootstrap();
