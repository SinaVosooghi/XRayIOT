import { Module } from '@nestjs/common';
import { DlqReplayService } from './dlq-replay.service';
import { DlqController } from './dlq.controller';

@Module({
  providers: [DlqReplayService],
  controllers: [DlqController],
  exports: [DlqReplayService],
})
export class DlqModule {}
