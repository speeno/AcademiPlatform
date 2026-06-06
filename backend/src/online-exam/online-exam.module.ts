import { Module } from '@nestjs/common';
import { NotifyModule } from '../notify/notify.module';
import { OnlineExamController } from './online-exam.controller';
import { OnlineExamService } from './online-exam.service';

@Module({
  imports: [NotifyModule],
  controllers: [OnlineExamController],
  providers: [OnlineExamService],
  exports: [OnlineExamService],
})
export class OnlineExamModule {}
