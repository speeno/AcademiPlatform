import { Module } from '@nestjs/common';
import { TrainingController } from './training.controller';
import { TrainingAdminController } from './training-admin.controller';
import { TrainingPublicController } from './training-public.controller';
import { TrainingPlansPublicController } from './training-plans-public.controller';
import { TrainingService } from './training.service';
import { TrainingPermissionService } from './training-permission.service';
import { TrainingCertificateService } from './training-certificate.service';
import { TrainingPermissionGuard } from './guards/training-permission.guard';

@Module({
  // TrainingPublicController 를 TrainingController 보다 먼저 등록해
  // 'certificates/verify/:no' 가 'certificates/:certId/pdf' 류 경로보다 우선 매칭되게 한다.
  controllers: [
    TrainingPublicController,
    TrainingPlansPublicController,
    TrainingController,
    TrainingAdminController,
  ],
  providers: [
    TrainingService,
    TrainingPermissionService,
    TrainingCertificateService,
    TrainingPermissionGuard,
  ],
  exports: [TrainingPermissionService],
})
export class TrainingModule {}
