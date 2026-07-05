import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface PersonalContext {
  /** 조회된 개인 데이터를 LLM 컨텍스트 문자열로 직렬화한 값 */
  contextText: string;
  /** 조회된 데이터 요약 (디버깅/추적용) */
  summary: string;
}

export interface QmiUser {
  id: string;
  role: string;
  name?: string | null;
  email?: string;
  /** 개인 학습 데이터를 외부 LLM 프롬프트에 포함해도 되는지에 대한 사용자 동의 */
  qmiPersonalConsent?: boolean;
}

/** 개인화 질의 키워드 — 이 단어가 질문에 포함되면 DB 개인 데이터를 조회한다 */
const PERSONAL_QUERY_PATTERNS = [
  // 시험 점수/결과
  /시험.*점|점수|성적|결과|합격|불합격|몇\s*점|득점/,
  // 예정/일정
  /다음.*시험|시험.*언제|시험.*일정|시험.*날짜|시험.*예정|일정.*시험/,
  // 수강/진도
  /수강.*중|내.*강의|진도|진행.*상황|듣고.*있|수강.*현황|강의.*진행/,
  // 신청/접수
  /시험.*신청|접수.*했|신청.*했/,
];

function isPersonalQuery(message: string): boolean {
  return PERSONAL_QUERY_PATTERNS.some((re) => re.test(message));
}

@Injectable()
export class PersonalContextService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 사용자의 메시지에 개인 데이터가 필요한지 판단한 뒤
   * 관련 DB 데이터를 조회해 LLM 컨텍스트 문자열로 반환한다.
   * 개인 질의가 아니거나 로그인이 아닌 경우 빈 컨텍스트를 반환한다.
   */
  async build(message: string, user: QmiUser | null): Promise<PersonalContext> {
    if (!user || !isPersonalQuery(message)) {
      return { contextText: '', summary: 'no-personal' };
    }

    const parts: string[] = [];

    // ── 1. 시험 점수/결과 ──────────────────────────────────────────
    const examAttempts = await this.prisma.examAttempt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        examSession: { select: { qualificationName: true, roundName: true, examAt: true } },
        result: { select: { totalScore: true, maxScore: true, percentage: true, status: true } },
      },
    });

    if (examAttempts.length > 0) {
      const lines = examAttempts.map((a) => {
        const session = a.examSession;
        const result = a.result;
        const datePart = session.examAt
          ? `(${session.examAt.toLocaleDateString('ko-KR')})`
          : '';
        if (!result) {
          return `• ${session.qualificationName} ${session.roundName} ${datePart} — 채점 대기 중`;
        }
        const pass = result.percentage >= 60 ? '합격' : '불합격';
        return `• ${session.qualificationName} ${session.roundName} ${datePart} — ${result.totalScore}/${result.maxScore}점 (${result.percentage.toFixed(1)}%) ${pass}`;
      });
      parts.push('[나의 시험 결과 (최근 5회)]\n' + lines.join('\n'));
    }

    // ── 2. 예정 시험 일정 ─────────────────────────────────────────
    const upcomingSessions = await this.prisma.examSession.findMany({
      where: { status: 'UPCOMING', examAt: { gte: new Date() } },
      orderBy: { examAt: 'asc' },
      take: 5,
      select: {
        id: true,
        qualificationName: true,
        roundName: true,
        examAt: true,
        applyStartAt: true,
        applyEndAt: true,
        place: true,
        fee: true,
        applications: {
          where: { userId: user.id },
          select: { id: true, status: true },
        },
      },
    });

    if (upcomingSessions.length > 0) {
      const lines = upcomingSessions.map((s) => {
        const myApp = s.applications[0];
        const applied = myApp ? ` [신청완료: ${myApp.status}]` : '';
        const place = s.place ? ` / 장소: ${s.place}` : '';
        const applyPeriod = `접수: ${s.applyStartAt.toLocaleDateString('ko-KR')} ~ ${s.applyEndAt.toLocaleDateString('ko-KR')}`;
        return `• ${s.qualificationName} ${s.roundName} — 시험일: ${s.examAt.toLocaleDateString('ko-KR')}${place} / ${applyPeriod}${applied}`;
      });
      parts.push('[예정 시험 일정]\n' + lines.join('\n'));
    }

    // ── 3. 수강 중인 강의 ─────────────────────────────────────────
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId: user.id, status: 'ACTIVE' },
      orderBy: { enrolledAt: 'desc' },
      take: 5,
      include: {
        course: { select: { title: true, category: true } },
      },
    });

    if (enrollments.length > 0) {
      const lines = enrollments.map((e) => {
        const prog = Math.round((e.progressRate ?? 0) * 100);
        const expiry = e.expiresAt
          ? ` / 수강만료: ${e.expiresAt.toLocaleDateString('ko-KR')}`
          : '';
        return `• ${e.course.title} — 진도율 ${prog}%${expiry}`;
      });
      parts.push('[내 수강 중인 강의]\n' + lines.join('\n'));
    }

    // ── 관리자용: 전체 통계 ───────────────────────────────────────
    if (user.role === 'SUPER_ADMIN' || user.role === 'OPERATOR') {
      const [totalEnrollments, pendingApplications] = await Promise.all([
        this.prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
        this.prisma.examApplication.count({ where: { status: 'PAYMENT_PENDING' } }),
      ]);
      parts.push(
        `[관리자 현황]\n• 활성 수강생: ${totalEnrollments}명 / 시험 접수 대기: ${pendingApplications}건`,
      );
    }

    if (parts.length === 0) {
      return {
        contextText: '',
        summary: 'no-data',
      };
    }

    const userName = user.name ?? '학습자';
    const header = `[${userName} 님의 개인 학습 데이터]`;
    return {
      contextText: [header, ...parts].join('\n\n'),
      summary: `personal:${parts.length}blk`,
    };
  }
}
