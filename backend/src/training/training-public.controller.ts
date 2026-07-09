import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { TrainingCertificateService } from './training-certificate.service';

// 수료증 진위확인 — 인증 불필요. 전역 ThrottlerGuard 가 열거 시도를 제한한다.
@Controller('training/certificates')
export class TrainingPublicController {
  constructor(private certificateService: TrainingCertificateService) {}

  @Public()
  @Get('verify/:certificateNo')
  verify(@Param('certificateNo') certificateNo: string) {
    return this.certificateService.verify(certificateNo);
  }
}
