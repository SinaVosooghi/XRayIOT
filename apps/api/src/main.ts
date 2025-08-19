import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '../../../libs/shared-config/src';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get configuration service
  const configService = app.get(ConfigService);

  // Configure CORS
  app.enableCors({
    origin: configService.security.corsOrigin,
    credentials: configService.security.corsCredentials,
  });

  // Configure validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  // Set global prefix to match Swagger setup
  app.setGlobalPrefix('api');

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('PANTOhealth IoT X-Ray API')
    .setDescription('API for managing IoT X-Ray data')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Start server
  const port = configService.port;
  const host = configService.host;
  await app.listen(port, host);

  console.log(`🚀 API service is running on ${host}:${port}`);
  console.log(`📚 Swagger documentation available at http://${host}:${port}/api`);
  console.log(`🌍 Environment: ${configService.nodeEnv}`);
}

void bootstrap();
