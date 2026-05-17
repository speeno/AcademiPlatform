import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ExamApplicationStatus, ExamSessionStatus, PaymentStatus } from '@prisma/client';
import { maskPriceFields } from '../common/pricing/public-price-policy';

const DEFAULT_DEPOSIT_ACCOUNT = {
  bank: '농협은행',
  account: '302-0608-9280-11',
  holder: '이현길',
};

@Injectable()
export class ExamService {
  private readonly referrerGroupsKey = 'referrer_groups';

  constructor(private prisma: PrismaService) {}

  async findSessions(
    filter: { status?: ExamSessionStatus; page?: number; limit?: number },
    viewerId?: string,
  ) {
    const { status, page = 1, limit = 10 } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    else where.status = { in: [ExamSessionStatus.UPCOMING, ExamSessionStatus.OPEN] };

    const [sessions, total] = await Promise.all([
      this.prisma.examSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { examAt: 'asc' },
        include: { _count: { select: { applications: true } } },
      }),
      this.prisma.examSession.count({ where }),
    ]);

    return {
      sessions: sessions.map((s) => maskPriceFields(s, viewerId)),
      total,
      page,
      limit,
    };
  }

  async findSessionById(id: string, viewerId?: string) {
    const session = await this.prisma.examSession.findUnique({
      where: { id },
      include: { _count: { select: { applications: true } } },
    });
    if (!session) throw new NotFoundException('시험 회차를 찾을 수 없습니다.');
    return maskPriceFields(session, viewerId);
  }

  async createApplication(sessionId: string, userId: string | null, formJson: object) {
    const session = await this.findSessionById(sessionId, userId ?? undefined);

    if (session.status !== ExamSessionStatus.OPEN) {
      throw new BadRequestException('현재 접수 기간이 아닙니다.');
    }

    const now = new Date();
    if (now < session.applyStartAt || now > session.applyEndAt) {
      throw new BadRequestException('접수 기간이 아닙니다.');
    }

    // 정원 확인
    if (session.capacity) {
      const count = await this.prisma.examApplication.count({
        where: {
          examSessionId: sessionId,
          status: { in: [ExamApplicationStatus.APPLIED, ExamApplicationStatus.PAYMENT_PENDING] },
        },
      });
      if (count >= session.capacity) throw new BadRequestException('정원이 초과되었습니다.');
    }

    // 중복 접수 확인 (로그인 사용자만 userId 기반 체크)
    if (userId) {
      const existing = await this.prisma.examApplication.findFirst({
        where: {
          examSessionId: sessionId,
          userId,
          status: { notIn: [ExamApplicationStatus.CANCELLED, ExamApplicationStatus.REFUNDED] },
        },
      });
      if (existing) throw new BadRequestException('이미 접수하셨습니다.');
    }

    const form = formJson as any;
    const referrerCode = typeof form?.referrerCode === 'string' ? form.referrerCode || null : null;

    return this.prisma.examApplication.create({
      data: {
        examSessionId: sessionId,
        userId,
        formJson: formJson as any,
        referrerCode,
        status: ExamApplicationStatus.APPLIED,
        paymentStatus: PaymentStatus.PAID,
      },
    });
  }

  async getMyApplications(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) return [];

    const sessionSelect = {
      id: true,
      qualificationName: true,
      roundName: true,
      examAt: true,
      place: true,
      fee: true,
    } as const;

    const linked = await this.prisma.examApplication.findMany({
      where: { userId },
      include: { examSession: { select: sessionSelect } },
      orderBy: { appliedAt: 'desc' },
    });

    const orphans = await this.prisma.examApplication.findMany({
      where: {
        userId: null,
        formJson: {
          path: ['email'],
          equals: user.email,
        },
      },
      include: { examSession: { select: sessionSelect } },
      orderBy: { appliedAt: 'desc' },
    });

    if (orphans.length > 0) {
      await this.prisma.examApplication.updateMany({
        where: { id: { in: orphans.map((app) => app.id) } },
        data: { userId },
      });
    }

    const seen = new Set<string>();
    const applications = [...linked, ...orphans]
      .sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime())
      .filter((app) => {
        if (seen.has(app.id)) return false;
        seen.add(app.id);
        return true;
      });

    const groups = await this.loadReferrerGroups();
    return applications.map((app) => ({
      ...app,
      depositAccount: this.resolveDepositAccount(app.formJson, app.referrerCode, groups),
    }));
  }

  private async loadReferrerGroups(): Promise<any[]> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: this.referrerGroupsKey },
    });
    if (!setting?.value) return [];
    try {
      const parsed = JSON.parse(setting.value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private resolveDepositAccount(
    formJson: unknown,
    referrerCode: string | null,
    groups: Array<{ members?: Array<{ code: string; label: string; depositBank?: string; depositAccount?: string; depositHolder?: string }> }>,
  ) {
    const form = formJson as Record<string, unknown> | null;
    const snapshot = form?.depositAccount as Record<string, string> | undefined;
    const snapshotBank = snapshot?.bank?.trim();
    const snapshotAccount = snapshot?.account?.trim();

    if (snapshotBank && snapshotAccount) {
      return {
        bank: snapshotBank,
        account: snapshotAccount,
        holder: snapshot?.holder?.trim() || DEFAULT_DEPOSIT_ACCOUNT.holder,
        sourceLabel: snapshot?.sourceLabel?.trim() || undefined,
      };
    }

    if (referrerCode) {
      for (const group of groups) {
        const member = group.members?.find((m) => m.code === referrerCode);
        if (!member) continue;
        const bank = member.depositBank?.trim();
        const account = member.depositAccount?.trim();
        if (bank && account) {
          return {
            bank,
            account,
            holder: member.depositHolder?.trim() || member.label || DEFAULT_DEPOSIT_ACCOUNT.holder,
            sourceLabel: member.label,
          };
        }
      }
    }

    return { ...DEFAULT_DEPOSIT_ACCOUNT };
  }

  async cancelApplication(applicationId: string, userId: string) {
    const app = await this.prisma.examApplication.findUnique({
      where: { id: applicationId },
    });

    if (!app || app.userId !== userId) throw new NotFoundException('접수 내역을 찾을 수 없습니다.');
    if (app.status === ExamApplicationStatus.CANCELLED) throw new BadRequestException('이미 취소된 접수입니다.');

    return this.prisma.examApplication.update({
      where: { id: applicationId },
      data: {
        status: app.paymentId
          ? ExamApplicationStatus.REFUND_REQUESTED
          : ExamApplicationStatus.CANCELLED,
      },
    });
  }

  /* 관리자 API */
  async findAllSessions(filter: { status?: ExamSessionStatus; page?: number; limit?: number }) {
    const { status, page = 1, limit = 50 } = filter;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [sessions, total] = await Promise.all([
      this.prisma.examSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { examAt: 'desc' },
        include: { _count: { select: { applications: true } } },
      }),
      this.prisma.examSession.count({ where }),
    ]);
    return { sessions, total, page, limit };
  }

  async createSession(data: any) {
    return this.prisma.examSession.create({ data: this.normalizeSessionData(data) });
  }

  async updateSession(id: string, data: any) {
    await this.findSessionById(id);
    return this.prisma.examSession.update({ where: { id }, data: this.normalizeSessionData(data) });
  }

  private normalizeSessionData(data: any) {
    const dateFields = ['examAt', 'applyStartAt', 'applyEndAt'] as const;
    const result = { ...data };
    for (const field of dateFields) {
      if (typeof result[field] === 'string' && result[field]) {
        result[field] = new Date(result[field]);
      }
    }
    if (typeof result.fee === 'string') result.fee = Number(result.fee);
    if (typeof result.capacity === 'string') result.capacity = Number(result.capacity) || null;
    if (result.basePrice !== undefined && typeof result.basePrice === 'string') result.basePrice = Number(result.basePrice);
    return result;
  }

  async getApplicationsBySession(sessionId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [applications, total] = await Promise.all([
      this.prisma.examApplication.findMany({
        where: { examSessionId: sessionId },
        skip,
        take: limit,
        orderBy: { appliedAt: 'asc' },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      }),
      this.prisma.examApplication.count({ where: { examSessionId: sessionId } }),
    ]);
    return { applications, total, page, limit };
  }

  async updateApplicationStatus(id: string, status: ExamApplicationStatus) {
    return this.prisma.examApplication.update({
      where: { id },
      data: { status },
    });
  }
}
