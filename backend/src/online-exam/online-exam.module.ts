import { Module } from '@nestjs/common';
import { NotifyModule } from '../notify/notify.module';
import { ExamPaperPdfService } from './exam-paper-pdf.service';
import { OnlineExamController } from './online-exam.controller';
import { OnlineExamService } from './online-exam.service';

@Module({
  imports: [NotifyModule],
  controllers: [OnlineExamController],
  providers: [OnlineExamService, ExamPaperPdfService],
  exports: [OnlineExamService],
})
export class OnlineExamModule {}
