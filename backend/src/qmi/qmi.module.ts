import { Module } from '@nestjs/common';
import { QmiController } from './qmi.controller';
import { QmiService } from './qmi.service';
import { QmiDocumentService } from './document.service';
import { QmiOpenAiService } from './openai.service';
import { PersonalContextService } from './personal-context.service';

@Module({
  controllers: [QmiController],
  providers: [QmiService, QmiDocumentService, QmiOpenAiService, PersonalContextService],
  exports: [QmiService, QmiDocumentService],
})
export class QmiModule {}
