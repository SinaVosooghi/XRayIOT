import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SignalsController } from './signals.controller';
import { SignalsService } from './signals.service';
import { SignalsValidationService } from './signals-validation.service';
import { XRay, XRaySchema } from '../../../signals/src/xray/xray.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: XRay.name, schema: XRaySchema }])],
  controllers: [SignalsController],
  providers: [SignalsService, SignalsValidationService],
})
export class SignalsModule {}
