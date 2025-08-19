import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
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
export class XRayModule {}
