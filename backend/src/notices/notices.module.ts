import { Module } from '@nestjs/common';
import { NoticesController } from './notices.controller';
import { NoticeAttachmentService } from './notice-attachment.service';

@Module({
  controllers: [NoticesController],
  providers: [NoticeAttachmentService],
  exports: [NoticeAttachmentService],
})
export class NoticesModule {}
