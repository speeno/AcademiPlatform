import { Module } from '@nestjs/common';
import { NotifyModule } from '../notify/notify.module';
import { QnaController } from './qna.controller';
import { QnaService } from './qna.service';

@Module({
  imports: [NotifyModule],
  controllers: [QnaController],
  providers: [QnaService],
  exports: [QnaService],
})
export class QnaModule {}
