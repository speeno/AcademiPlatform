import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ExamApplicationStatus, ExamSessionStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class ExamService {
  constructor(private prisma: PrismaService) {}

  async findSessions(filter: { status?: ExamSessionStatus; page?: number; limit?: number }) {
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

    return { sessions, total, page, limit };
  }

  async findSessionById(id: string) {
    const session = await this.prisma.examSession.findUnique({
      where: { id },
      include: { _count: { select: { applications: true } } },
    });
    if (!session) throw new NotFoundException('시험 회차를 찾을 수 없습니다.');
    return session;
  }

  async createApplication(sessionId: string, userId: string, formJson: object) {
    const session = await this.findSessionById(sessionId);

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

    // 중복 접수 확인
    const existing = await this.prisma.examApplication.findFirst({
      where: {
        examSessionId: sessionId,
        userId,
        status: { notIn: [ExamApplicationStatus.CANCELLED, ExamApplicationStatus.REFUNDED] },
      },
    });
    if (existing) throw new BadRequestException('이미 접수하셨습니다.');

    return this.prisma.examApplication.create({
      data: {
        examSessionId: sessionId,
        userId,
        formJson: formJson as any,
        status: session.fee > 0
          ? ExamApplicationStatus.PAYMENT_PENDING
          : ExamApplicationStatus.APPLIED,
        paymentStatus: session.fee > 0 ? PaymentStatus.PENDING : PaymentStatus.PAID,
      },
    });
  }

  async getMyApplications(userId: string) {
    return this.prisma.examApplication.findMany({
      where: { userId },
      include: {
        examSession: {
          select: { id: true, qualificationName: true, roundName: true, examAt: true, place: true, fee: true },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });
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
  async createSession(data: any) {
    return this.prisma.examSession.create({ data });
  }

  async updateSession(id: string, data: any) {
    await this.findSessionById(id);
    return this.prisma.examSession.update({ where: { id }, data });
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
