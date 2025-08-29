import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { XRay, XRaySchema } from './xray.schema';
import { XRayService } from './xray.service';
import { XRayConsumer } from './xray.consumer';
import { RawModule } from '../raw/raw.module';
import { RmqModule } from '../rmq/rmq.module';
import { ErrorHandlingService } from '../error-handling/error-handling.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: XRay.name, schema: XRaySchema }]),
    RawModule,
    RmqModule,
  ],
  providers: [XRayService, XRayConsumer, ErrorHandlingService],
  exports: [XRayService],
})
export class XRayModule implements OnModuleInit {
  constructor(@InjectModel(XRay.name) private readonly xrayModel: Model<XRay>) {}

  async onModuleInit() {
    // Ensure indexes exist
    await this.ensureIndexes();
  }

  private async ensureIndexes() {
    try {
      await this.xrayModel.createIndexes();
      console.log('✅ XRay indexes ensured');

      // Log current indexes for verification
      const indexes = await this.xrayModel.collection.indexes();
      console.log(`📊 Current indexes: ${indexes.map(idx => idx.name).join(', ')}`);
    } catch (error) {
      console.error('❌ Error ensuring indexes:', error);
      // Don't throw - allow service to continue without indexes
    }
  }
}
