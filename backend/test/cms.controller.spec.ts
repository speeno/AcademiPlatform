import { CmsReviewStatus, UserRole } from '@prisma/client';
import { CmsController } from '../src/cms/cms.controller';

describe('CmsController', () => {
  const service = {
    reviewDecision: jest.fn(),
    rollbackLesson: jest.fn(),
  } as any;
  const controller = new CmsController(service);
  const operator = { id: 'operator-1', role: UserRole.OPERATOR } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('approveReview는 APPROVED 상태로 위임해야 한다', async () => {
    service.reviewDecision.mockResolvedValue({ ok: true });
    await controller.approveReview('req-1', operator);

    expect(service.reviewDecision).toHaveBeenCalledWith(
      'req-1',
      'operator-1',
      { status: CmsReviewStatus.APPROVED },
    );
  });

  it('rejectReview는 REJECTED 상태와 사유를 전달해야 한다', async () => {
    service.reviewDecision.mockResolvedValue({ ok: true });
    await controller.rejectReview('req-2', { status: CmsReviewStatus.REJECTED, rejectReason: '검수 실패' }, operator);

    expect(service.reviewDecision).toHaveBeenCalledWith(
      'req-2',
      'operator-1',
      { status: CmsReviewStatus.REJECTED, rejectReason: '검수 실패' },
    );
  });

  it('rollback은 versionNo를 숫자로 전달해야 한다', async () => {
    service.rollbackLesson.mockResolvedValue({ rolledBackTo: 2 });
    await controller.rollback('lesson-1', 2, operator);
    expect(service.rollbackLesson).toHaveBeenCalledWith('lesson-1', 2, 'operator-1');
  });
});
