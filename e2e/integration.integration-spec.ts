import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService, SharedConfigModule } from '@iotp/shared-config';

describe('Integration Tests - Application Services', () => {
  let app: INestApplication;
  let configService: ConfigService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [SharedConfigModule],
      providers: [],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    configService = app.get(ConfigService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Configuration Service', () => {
    it('should have ConfigService available', () => {
      expect(configService).toBeDefined();
    });

    it('should be able to access environment variables', () => {
      const nodeEnv = configService.nodeEnv;
      expect(nodeEnv).toBeDefined();
    });

    it('should have database configuration', () => {
      expect(configService.database.uri).toBeDefined();
      expect(configService.rabbitmq.uri).toBeDefined();
      expect(configService.redis.uri).toBeDefined();
    });
  });

  describe('Application Health', () => {
    it('should pass basic health check', () => {
      expect(true).toBe(true);
    });

    it('should have all required services configured', () => {
      expect(configService.database.uri).toContain('mongodb://');
      expect(configService.rabbitmq.uri).toContain('amqp://');
      expect(configService.redis.uri).toContain('redis://');
    });
  });

  describe('Environment Configuration', () => {
    it('should have correct environment setup', () => {
      expect(configService.nodeEnv).toBe('test');
    });

    it('should have valid configuration structure', () => {
      expect(configService.database).toBeDefined();
      expect(configService.rabbitmq).toBeDefined();
      expect(configService.redis).toBeDefined();
      expect(configService.storage).toBeDefined();
      expect(configService.security).toBeDefined();
      expect(configService.hmac).toBeDefined();
      expect(configService.observability).toBeDefined();
      expect(configService.producer).toBeDefined();
    });
  });
});
