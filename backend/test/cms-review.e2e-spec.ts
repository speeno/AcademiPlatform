import { Test } from '@nestjs/testing';
import { CmsController } from '../src/cms/cms.controller';
import { CmsReviewStatus, UserRole } from '@prisma/client';
import { CmsService } from '../src/cms/cms.service';

describe('CMS review controller (e2e style)', () => {
  const cmsService = {
    reviewDecision: jest.fn(),
    rollbackLesson: jest.fn(),
  };

  let controller: CmsController;
  const operator = { id: 'operator-1', role: UserRole.OPERATOR };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [CmsController],
      providers: [{ provide: CmsService, useValue: cmsService }],
    })
      .overrideProvider(CmsService)
      .useValue(cmsService)
      .compile();

    controller = moduleRef.get(CmsController);
  });

  it('승인 요청 시 APPROVED 상태를 전달한다', async () => {
    cmsService.reviewDecision.mockResolvedValue({ ok: true });
    await controller.approveReview('req-1', operator);
    expect(cmsService.reviewDecision).toHaveBeenCalledWith(
      'req-1',
      'operator-1',
      { status: CmsReviewStatus.APPROVED },
    );
  });

  it('반려 요청 시 사유를 전달한다', async () => {
    cmsService.reviewDecision.mockResolvedValue({ ok: true });
    await controller.rejectReview(
      'req-2',
      { status: CmsReviewStatus.REJECTED, rejectReason: '검수 기준 미충족' },
      operator,
    );
    expect(cmsService.reviewDecision).toHaveBeenCalledWith(
      'req-2',
      'operator-1',
      { status: CmsReviewStatus.REJECTED, rejectReason: '검수 기준 미충족' },
    );
  });
});
