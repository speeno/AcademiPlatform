import { ConflictException } from '@nestjs/common';
import {
  TrainingCertificateService,
  maskName,
} from '../src/training/training-certificate.service';

/**
 * 수료증 규칙.
 * - 번호: {PREFIX}-{연도}-{4자리 seq}, 연도별 카운터 트랜잭션 채번
 * - ISSUED 수료증 보유자는 재차 발급 불가(409)
 * - 발급 시 참가자 상태 → COMPLETED, 스냅샷 저장
 * - 진위확인: 미존재/폐기 → {valid:false}, 정상 → 마스킹된 이름
 */
describe('TrainingCertificateService', () => {
  const OWNER = { id: 'owner-1', role: 'USER' } as any;

  const buildProgram = (overrides: Partial<any> = {}) => ({
    id: 'prog-1',
    title: 'AI 실무 과정',
    ownerId: OWNER.id,
    startDate: new Date('2026-07-01'),
    endDate: new Date('2026-07-31'),
    _count: { sessions: 4 },
    ...overrides,
  });

  const buildTx = (seqStart = 0) => {
    let seq = seqStart;
    const created: any[] = [];
    return {
      _created: created,
      trainingCertificateCounter: {
        upsert: jest.fn(async () => ({ year: 2026, lastSeq: ++seq })),
      },
      trainingCertificate: {
        create: jest.fn(async ({ data }: any) => {
          const row = { id: `cert-${created.length + 1}`, issuedAt: new Date(), ...data };
          created.push(row);
          return row;
        }),
      },
      trainingParticipant: {
        update: jest.fn(async () => ({})),
      },
    };
  };

  const buildPrisma = (opts: Partial<any> = {}) => {
    const tx = opts.tx ?? buildTx();
    return {
      _tx: tx,
      trainingProgram: {
        findUnique: jest.fn(async () => opts.program ?? buildProgram()),
      },
      trainingParticipant: {
        findMany: jest.fn(async () => opts.participants ?? []),
      },
      trainingSession: {
        findMany: jest.fn(async () => opts.sessions ?? []),
        count: jest.fn(async () => opts.sessionCount ?? 0),
      },
      trainingAttendance: {
        findMany: jest.fn(async () => opts.attendances ?? []),
      },
      trainingCertificate: {
        findUnique: jest.fn(async () => opts.certificate ?? null),
      },
      $transaction: jest.fn(async (fn: any) => fn(tx)),
    } as any;
  };

  it('maskName: 가운데 글자를 가린다 (홍길동→홍*동, 김철→김*)', () => {
    expect(maskName('홍길동')).toBe('홍*동');
    expect(maskName('김철')).toBe('김*');
    expect(maskName('남궁민수')).toBe('남**수');
    expect(maskName('a')).toBe('a');
  });

  it('발급 번호는 PREFIX-연도-4자리 순번 형식이며 순번이 증가한다', async () => {
    const participants = [
      { id: 'p1', name: '갑', certificates: [] },
      { id: 'p2', name: '을', certificates: [] },
    ];
    const prisma = buildPrisma({ participants });
    const service = new TrainingCertificateService(prisma);

    const { issued } = await service.issueCertificates(OWNER, 'prog-1', ['p1', 'p2']);

    expect(issued).toHaveLength(2);
    expect(issued[0].certificateNo).toMatch(/^AQ-EDU-\d{4}-0001$/);
    expect(issued[1].certificateNo).toMatch(/^AQ-EDU-\d{4}-0002$/);
    // 발급 시 참가자 상태 COMPLETED 전환
    expect(prisma._tx.trainingParticipant.update).toHaveBeenCalledTimes(2);
  });

  it('이미 ISSUED 수료증이 있는 참가자는 409 이다', async () => {
    const participants = [
      { id: 'p1', name: '갑', certificates: [{ id: 'cert-old' }] },
    ];
    const prisma = buildPrisma({ participants });
    const service = new TrainingCertificateService(prisma);

    await expect(
      service.issueCertificates(OWNER, 'prog-1', ['p1']),
    ).rejects.toThrow(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('발급 데이터에 이름/과정명 스냅샷이 저장된다', async () => {
    const participants = [{ id: 'p1', name: '갑', certificates: [] }];
    const prisma = buildPrisma({ participants });
    const service = new TrainingCertificateService(prisma);

    await service.issueCertificates(OWNER, 'prog-1', ['p1']);

    expect(prisma._tx._created[0]).toMatchObject({
      participantName: '갑',
      programTitle: 'AI 실무 과정',
      programId: 'prog-1',
      issuedById: OWNER.id,
    });
  });

  it('진위확인: 미존재 번호는 valid:false 균일 응답이다', async () => {
    const prisma = buildPrisma({ certificate: null });
    const service = new TrainingCertificateService(prisma);
    await expect(service.verify('AQ-EDU-2026-9999')).resolves.toEqual({
      valid: false,
    });
  });

  it('진위확인: 폐기된 수료증도 valid:false 이다', async () => {
    const prisma = buildPrisma({
      certificate: {
        certificateNo: 'AQ-EDU-2026-0001',
        status: 'REVOKED',
        participantName: '홍길동',
        programTitle: '과정',
        program: { startDate: new Date('2026-07-01'), endDate: new Date('2026-07-31') },
      },
    });
    const service = new TrainingCertificateService(prisma);
    await expect(service.verify('AQ-EDU-2026-0001')).resolves.toEqual({
      valid: false,
    });
  });

  it('진위확인: 정상 수료증은 마스킹된 이름과 과정 정보를 반환한다', async () => {
    const prisma = buildPrisma({
      certificate: {
        certificateNo: 'AQ-EDU-2026-0001',
        status: 'ISSUED',
        participantName: '홍길동',
        programTitle: 'AI 실무 과정',
        issuedAt: new Date('2026-08-01'),
        program: { startDate: new Date('2026-07-01'), endDate: new Date('2026-07-31') },
      },
    });
    const service = new TrainingCertificateService(prisma);
    const result = await service.verify('AQ-EDU-2026-0001');
    expect(result).toMatchObject({
      valid: true,
      participantName: '홍*동',
      programTitle: 'AI 실무 과정',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
    });
  });
});
