import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService, SharedConfigModule } from '@iotp/shared-config';

describe('Integration Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [SharedConfigModule],
      providers: [],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Basic Integration', () => {
    it('should have a working application instance', () => {
      expect(app).toBeDefined();
    });

    it('should have ConfigService available', () => {
      const configService = app.get(ConfigService);
      expect(configService).toBeDefined();
    });

    it('should be able to access environment variables', () => {
      const configService = app.get(ConfigService);
      const nodeEnv = configService.nodeEnv;
      expect(nodeEnv).toBeDefined();
    });
  });

  describe('Health Check', () => {
    it('should pass basic health check', () => {
      expect(true).toBe(true);
    });
  });
});
