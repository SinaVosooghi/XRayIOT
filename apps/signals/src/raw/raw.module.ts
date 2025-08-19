import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RawStoreGridFS } from './raw.store.gridfs';

@Module({
  imports: [MongooseModule.forFeature([])],
  providers: [
    {
      provide: 'IRawStore',
      useClass: RawStoreGridFS,
    },
  ],
  exports: ['IRawStore'],
})
export class RawModule {}
