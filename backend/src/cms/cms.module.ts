import { Module } from '@nestjs/common';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { CmsAccessService } from './services/cms-access.service';
import { CmsStorageService } from './services/cms-storage.service';
import { CmsContentService } from './services/cms-content.service';
import { CmsReviewService } from './services/cms-review.service';
import { CmsImportService } from './services/cms-import.service';

@Module({
  controllers: [CmsController],
  providers: [
    CmsService,
    CmsAccessService,
    CmsStorageService,
    CmsContentService,
    CmsReviewService,
    CmsImportService,
  ],
  exports: [CmsService],
})
export class CmsModule {}
