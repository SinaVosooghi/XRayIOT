import { exec } from 'child_process';
import { promisify } from 'util';
import { config } from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
config({ path: '.env.test' });

const execAsync = promisify(exec);

export class TestInfrastructure {
  private static instance: TestInfrastructure;
  private mongoConnection: mongoose.Connection | null = null;

  private constructor() {}

  static getInstance(): TestInfrastructure {
    if (!TestInfrastructure.instance) {
      TestInfrastructure.instance = new TestInfrastructure();
    }
    return TestInfrastructure.instance;
  }

  /**
   * Start the test infrastructure (assumes already running)
   */
  start(): void {
    console.log('✅ Test infrastructure already running (assumed)');
  }

  /**
   * Stop the test infrastructure (no-op, assumes manual management)
   */
  stop(): void {
    console.log('✅ Test infrastructure management assumed manual');
  }

  /**
   * Connect to MongoDB for cleanup operations
   */
  private connectToMongo(): mongoose.Connection {
    if (this.mongoConnection) {
      return this.mongoConnection;
    }

    try {
      // For cleanup, we need to connect from the host machine to the external port
      const mongoUri =
        process.env.MONGO_URI?.replace('mongo-test:27017', 'localhost:27018') ||
        'mongodb://admin:password@localhost:27018/iotp-test?authSource=admin';
      this.mongoConnection = mongoose.createConnection(mongoUri);
      console.log('🔌 Connected to MongoDB for cleanup');
      return this.mongoConnection;
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB for cleanup:', error);
      throw error;
    }
  }

  /**
   * Clean up test data by deleting everything from all collections
   */
  async cleanup(): Promise<void> {
    try {
      console.log('🧹 Starting complete database cleanup...');

      const connection = this.connectToMongo();

      // Delete everything from known collections
      const knownCollections = ['signals', 'rawPayloads.files', 'rawPayloads.chunks'];
      let totalDeleted = 0;

      for (const collectionName of knownCollections) {
        try {
          const collectionObj = connection.collection(collectionName);

          // Count documents before deletion
          const beforeCount = await collectionObj.countDocuments({});

          if (beforeCount > 0) {
            // Delete all documents in this collection
            const deleteResult = await collectionObj.deleteMany({});
            console.log(`🗑️ Deleted ${deleteResult.deletedCount} documents from ${collectionName}`);
            totalDeleted += deleteResult.deletedCount;
          } else {
            console.log(`✨ Collection ${collectionName} is already empty`);
          }
        } catch (error) {
          console.log(`⚠️ Could not access collection ${collectionName}: ${String(error)}`);
        }
      }

      console.log(`✅ Database cleanup completed: ${totalDeleted} total documents deleted`);
    } catch (error) {
      console.error('❌ Cleanup failed (CRITICAL):', error);
      // This is critical - throw error to fail tests if cleanup doesn't work
      throw new Error(`Database cleanup failed: ${String(error)}`);
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    if (this.mongoConnection) {
      try {
        await this.mongoConnection.close();
        this.mongoConnection = null;
        console.log('🔌 Disconnected from MongoDB');
      } catch (error) {
        console.warn('⚠️ Failed to disconnect from MongoDB:', error);
      }
    }
  }

  /**
   * Check if all services are healthy
   */
  private allServicesHealthy(psOutput: string): boolean {
    const lines = psOutput.split('\n');
    const serviceLines = lines.filter(
      line =>
        line.includes('mongo-test') ||
        line.includes('rabbit-test') ||
        line.includes('redis-test') ||
        line.includes('api-test') ||
        line.includes('signals-test') ||
        line.includes('producer-test')
    );

    return serviceLines.every(line => line.includes('Up'));
  }

  /**
   * Get service status
   */
  async getStatus(): Promise<string> {
    try {
      const { stdout } = await execAsync('docker ps');
      return stdout;
    } catch (error) {
      console.error('❌ Failed to get status:', error);
      return 'Error getting status';
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const testInfrastructure = TestInfrastructure.getInstance();

// Utility functions
export const waitForCondition = async (
  condition: () => Promise<boolean>,
  timeout: number = 10000,
  interval: number = 100
): Promise<void> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
};
