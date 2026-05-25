import { BadRequestException, NotFoundException } from '@nestjs/common';
import { NoticeAttachmentService } from '../src/notices/notice-attachment.service';

describe('NoticeAttachmentService', () => {
  const createService = (overrides?: Record<string, any>) => {
    const prisma = {
      notice: {
        findUnique: jest.fn(),
      },
      noticeAttachment: {
        count: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      ...overrides,
    };
    const config = {
      get: jest.fn().mockReturnValue(''),
    };
    const service = new NoticeAttachmentService(prisma as any, config as any);
    return { service, prisma };
  };

  it('5MB 초과 파일은 거부해야 한다', () => {
    const { service } = createService();
    expect(() =>
      (service as any).validateFile({
        originalname: 'too-large.pdf',
        mimetype: 'application/pdf',
        size: 5 * 1024 * 1024 + 1,
        buffer: Buffer.alloc(10),
      }),
    ).toThrow(BadRequestException);
  });

  it('허용되지 않은 문서 확장자는 거부해야 한다', () => {
    const { service } = createService();
    expect(() =>
      (service as any).validateFile({
        originalname: 'script.js',
        mimetype: 'application/octet-stream',
        size: 100,
        buffer: Buffer.from('x'),
      }),
    ).toThrow(BadRequestException);
  });

  it('HWP는 octet-stream이어도 확장자로 허용해야 한다', () => {
    const { service } = createService();
    const result = (service as any).validateFile({
      originalname: 'sample.hwp',
      mimetype: 'application/octet-stream',
      size: 120,
      buffer: Buffer.from('ok'),
    });

    expect(result.mimeType).toBe('application/x-hwp');
    expect(result.fileName).toBe('sample.hwp');
  });

  it('공지 ID가 없으면 업로드를 거부해야 한다', async () => {
    const { service, prisma } = createService();
    prisma.notice.findUnique.mockResolvedValue(null);

    await expect(
      service.upload('missing-notice', {
        originalname: 'sample.pdf',
        mimetype: 'application/pdf',
        size: 128,
        buffer: Buffer.from('ok'),
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removeAllForNotice는 첨부를 지우고 파일 정리를 호출해야 한다', async () => {
    const { service, prisma } = createService();
    prisma.noticeAttachment.findMany.mockResolvedValue([
      { storageKey: 'notices/1/a.pdf', localPath: null },
      { storageKey: null, localPath: 'static/notices/uploads/b.docx' },
    ]);
    prisma.noticeAttachment.deleteMany.mockResolvedValue({ count: 2 });

    const cleanupSpy = jest
      .spyOn(service as any, 'cleanupAttachmentFile')
      .mockResolvedValue(undefined);

    await service.removeAllForNotice('notice-1');

    expect(prisma.noticeAttachment.findMany).toHaveBeenCalledWith({
      where: { noticeId: 'notice-1' },
      select: { storageKey: true, localPath: true },
    });
    expect(prisma.noticeAttachment.deleteMany).toHaveBeenCalledWith({
      where: { noticeId: 'notice-1' },
    });
    expect(cleanupSpy).toHaveBeenCalledTimes(2);
  });
});
