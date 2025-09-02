import { Module } from '@nestjs/common';
import { DlqReplayService } from './dlq-replay.service';
import { DlqController } from './dlq.controller';
import { RmqModule } from '../rmq/rmq.module';
import { SharedConfigModule } from '@iotp/shared-config';

@Module({
  imports: [RmqModule, SharedConfigModule],
  providers: [DlqReplayService],
  controllers: [DlqController],
  exports: [DlqReplayService],
})
export class DlqModule {}
