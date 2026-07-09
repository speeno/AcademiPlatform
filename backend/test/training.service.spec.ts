import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { TrainingService } from '../src/training/training.service';

/**
 * 교육 운영 핵심 규칙.
 * - 회차 날짜는 프로그램 기간 내, 종료 시간 > 시작 시간
 * - 소유자가 아니면 403 (관리자는 전체 관리)
 * - 비회원 참가자는 이메일/전화(정규화) 중복 시 409
 * - 정원 초과 시 409 (allowOverCapacity 로 우회)
 * - 출석률 = (출석+지각) / 오늘까지 지나간 회차
 */
describe('TrainingService', () => {
  const OWNER = { id: 'owner-1', role: 'USER' } as any;
  const OTHER = { id: 'other-1', role: 'USER' } as any;
  const ADMIN = { id: 'admin-1', role: 'OPERATOR' } as any;

  const buildProgram = (overrides: Partial<any> = {}) => ({
    id: 'prog-1',
    title: '테스트 과정',
    ownerId: OWNER.id,
    location: '본원',
    capacity: null,
    startDate: new Date('2026-07-01'),
    endDate: new Date('2026-07-31'),
    status: 'IN_PROGRESS',
    ...overrides,
  });

  const buildPrisma = (opts: Partial<any> = {}) => {
    const prisma: any = {
      trainingProgram: {
        findUnique: jest.fn(async () => opts.program ?? buildProgram()),
        update: jest.fn(async ({ data }: any) => ({ ...buildProgram(), ...data })),
        delete: jest.fn(async () => ({})),
      },
      trainingSession: {
        findFirst: jest.fn(async () => opts.lastSession ?? null),
        findMany: jest.fn(async () => opts.sessions ?? []),
        findUnique: jest.fn(async () => opts.session ?? null),
        count: jest.fn(async () => opts.sessionCount ?? 0),
        create: jest.fn(async ({ data }: any) => ({
          id: 'sess-new',
          ...data,
          date: new Date(data.date),
        })),
      },
      trainingParticipant: {
        findMany: jest.fn(async () => opts.participants ?? []),
        count: jest.fn(async () => opts.participantCount ?? 0),
        create: jest.fn(async ({ data }: any) => ({ id: 'part-new', ...data })),
        findUnique: jest.fn(async () => opts.participant ?? null),
      },
      trainingAttendance: {
        findMany: jest.fn(async () => opts.attendances ?? []),
      },
      trainingCertificate: {
        count: jest.fn(async () => opts.certCount ?? 0),
      },
      user: {
        findUnique: jest.fn(async () => opts.member ?? null),
      },
      // 배열형(upsert 목록)과 콜백형(tx) 트랜잭션 모두 지원
      $transaction: jest.fn(async (arg: any) =>
        Array.isArray(arg) ? Promise.all(arg) : arg(prisma),
      ),
    };
    return prisma;
  };

  /* ── 소유권 ── */

  it('소유자가 아니면 프로그램 조회가 403 이다', async () => {
    const service = new TrainingService(buildPrisma());
    await expect(service.updateProgram(OTHER, 'prog-1', {})).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('관리자는 타인 프로그램도 관리할 수 있다', async () => {
    const service = new TrainingService(buildPrisma());
    await expect(
      service.updateProgram(ADMIN, 'prog-1', { title: '변경' }),
    ).resolves.toMatchObject({ title: '변경' });
  });

  /* ── 회차 ── */

  it('회차 날짜가 교육 기간 밖이면 400 이다', async () => {
    const service = new TrainingService(buildPrisma());
    await expect(
      service.addSession(OWNER, 'prog-1', {
        date: '2026-08-01',
        startTime: '10:00',
        endTime: '12:00',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('종료 시간이 시작 시간보다 빠르면 400 이다', async () => {
    const service = new TrainingService(buildPrisma());
    await expect(
      service.addSession(OWNER, 'prog-1', {
        date: '2026-07-10',
        startTime: '14:00',
        endTime: '13:00',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('회차 번호는 마지막 번호 + 1 로 자동 부여된다', async () => {
    const prisma = buildPrisma({ lastSession: { sessionNo: 3 } });
    const service = new TrainingService(prisma);
    const session = await service.addSession(OWNER, 'prog-1', {
      date: '2026-07-10',
      startTime: '10:00',
      endTime: '12:00',
    });
    expect(session.sessionNo).toBe(4);
  });

  it('일괄 등록: 기간 밖 날짜가 섞여 있으면 400 이며 해당 날짜를 알려준다', async () => {
    const service = new TrainingService(buildPrisma());
    await expect(
      service.addSessionsBulk(OWNER, 'prog-1', {
        dates: ['2026-07-10', '2026-08-02'],
        startTime: '10:00',
        endTime: '12:00',
      }),
    ).rejects.toThrow('2026-08-02');
  });

  it('일괄 등록: 입력 중복 날짜는 제거되고 날짜순으로 순번이 이어진다', async () => {
    const prisma = buildPrisma({ lastSession: { sessionNo: 2 } });
    const service = new TrainingService(prisma);
    const { sessions } = await service.addSessionsBulk(OWNER, 'prog-1', {
      dates: ['2026-07-20', '2026-07-06', '2026-07-20'],
      startTime: '10:00',
      endTime: '12:00',
    });
    expect(sessions).toHaveLength(2);
    expect(sessions.map((s: any) => [s.sessionNo, s.date])).toEqual([
      [3, '2026-07-06'],
      [4, '2026-07-20'],
    ]);
  });

  it('일괄 등록: 이미 회차가 있는 날짜에도 중복 등록이 허용된다', async () => {
    // 같은 날짜 기존 회차 존재 여부와 무관하게 생성된다 — 서비스에 날짜 중복 차단 로직이 없어야 한다
    const prisma = buildPrisma({ lastSession: { sessionNo: 1 } });
    const service = new TrainingService(prisma);
    const { sessions } = await service.addSessionsBulk(OWNER, 'prog-1', {
      dates: ['2026-07-06'],
      startTime: '10:00',
      endTime: '12:00',
    });
    expect(sessions).toHaveLength(1);
    expect(prisma.trainingSession.create).toHaveBeenCalledTimes(1);
  });

  it('기간 축소 시 기간 밖 회차가 있으면 409 이다', async () => {
    const prisma = buildPrisma();
    prisma.trainingSession.count = jest.fn(async () => 2);
    const service = new TrainingService(prisma);
    await expect(
      service.updateProgram(OWNER, 'prog-1', { endDate: '2026-07-15' }),
    ).rejects.toThrow(ConflictException);
  });

  /* ── 참가자 ── */

  it('비회원 등록 시 이름이 없으면 400 이다', async () => {
    const service = new TrainingService(buildPrisma());
    await expect(
      service.addParticipant(OWNER, 'prog-1', { phone: '010-1234-5678' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('비회원 등록 시 연락처/이메일이 모두 없으면 400 이다', async () => {
    const service = new TrainingService(buildPrisma());
    await expect(
      service.addParticipant(OWNER, 'prog-1', { name: '홍길동' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('동일 이메일(대소문자 무시)의 비회원은 409 이다', async () => {
    const prisma = buildPrisma({
      participants: [
        { id: 'p1', name: '김철수', email: 'kim@test.com', phone: null },
      ],
    });
    const service = new TrainingService(prisma);
    await expect(
      service.addParticipant(OWNER, 'prog-1', {
        name: '김철수',
        email: 'KIM@test.com',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('형식이 달라도 같은 전화번호(숫자 기준)면 409 이다', async () => {
    const prisma = buildPrisma({
      participants: [
        { id: 'p1', name: '김철수', email: null, phone: '010-1234-5678' },
      ],
    });
    const service = new TrainingService(prisma);
    await expect(
      service.addParticipant(OWNER, 'prog-1', {
        name: '박영희',
        phone: '01012345678',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('정원이 가득 차면 409, allowOverCapacity 면 등록된다', async () => {
    const program = buildProgram({ capacity: 2 });
    const prisma = buildPrisma({ program, participantCount: 2 });
    const service = new TrainingService(prisma);
    await expect(
      service.addParticipant(OWNER, 'prog-1', {
        name: '홍길동',
        phone: '010-9999-8888',
      }),
    ).rejects.toThrow(ConflictException);

    const created = await service.addParticipant(OWNER, 'prog-1', {
      name: '홍길동',
      phone: '010-9999-8888',
      allowOverCapacity: true,
    });
    expect(created.name).toBe('홍길동');
  });

  it('회원 등록은 프로필을 스냅샷으로 복사한다', async () => {
    const prisma = buildPrisma({
      member: {
        id: 'user-9',
        name: '이회원',
        email: 'lee@test.com',
        phone: '010-2222-3333',
      },
    });
    const service = new TrainingService(prisma);
    const created = await service.addParticipant(OWNER, 'prog-1', {
      userId: 'user-9',
    });
    expect(created).toMatchObject({
      userId: 'user-9',
      name: '이회원',
      email: 'lee@test.com',
    });
  });

  /* ── 출석률 ── */

  it('출석률은 지나간 회차 기준 (출석+지각)/회차수 로 계산된다', async () => {
    const prisma = buildPrisma({
      sessions: [
        { id: 's1', date: new Date('2020-01-01') }, // 지나간 회차
        { id: 's2', date: new Date('2020-01-08') }, // 지나간 회차
        { id: 's3', date: new Date('2999-01-01') }, // 미래 회차 — 분모 제외
      ],
      attendances: [
        { participantId: 'p1', sessionId: 's1', status: 'PRESENT' },
        { participantId: 'p1', sessionId: 's2', status: 'LATE' },
        { participantId: 'p1', sessionId: 's3', status: 'PRESENT' }, // 미래 — 무시
        { participantId: 'p2', sessionId: 's1', status: 'ABSENT' },
        { participantId: 'p2', sessionId: 's2', status: 'EXCUSED' },
      ],
      participants: [
        { id: 'p1', name: '갑', status: 'REGISTERED' },
        { id: 'p2', name: '을', status: 'REGISTERED' },
      ],
    });
    const service = new TrainingService(prisma);
    const summary = await service.getAttendanceSummary(OWNER, 'prog-1');

    expect(summary.heldSessions).toBe(2);
    expect(summary.totalSessions).toBe(3);
    const p1 = summary.participants.find((p) => p.participantId === 'p1');
    const p2 = summary.participants.find((p) => p.participantId === 'p2');
    expect(p1).toMatchObject({ attended: 2, rate: 100 });
    expect(p2).toMatchObject({ attended: 0, rate: 0 });
  });
});
