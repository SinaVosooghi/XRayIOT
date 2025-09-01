module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.integration-spec.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testTimeout: 120000, // Longer timeout for integration tests
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: true,

  // Ensure environment variables are loaded
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },
  // Add TypeScript path mapping support
  moduleNameMapper: {
    '^@iotp/(.*)$': '<rootDir>/../libs/$1/src',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          paths: {
            '@iotp/shared-config': ['<rootDir>/../libs/shared-config/src'],
            '@iotp/shared-utils': ['<rootDir>/../libs/shared-utils/src'],
            '@iotp/shared-messaging': ['<rootDir>/../libs/shared-messaging/src'],
            '@iotp/shared-types': ['<rootDir>/../libs/shared-types/src'],
            '@iotp/shared-observability': ['<rootDir>/../libs/shared-observability/src'],
          },
        },
      },
    ],
  },
};
