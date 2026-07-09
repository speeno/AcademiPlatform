import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TrainingCertificateStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { renderTrainingCertificatePdf } from './pdf/certificate-pdf.renderer';
import { toYmd, todayKstYmd } from './training.service';

type AuthUser = { id: string; role: UserRole | string };

// 수료자명 마스킹: 홍길동 → 홍*동, 김철 → 김*, 외자/영문도 중간을 가린다
export function maskName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= 1) return trimmed;
  if (trimmed.length === 2) return `${trimmed[0]}*`;
  return (
    trimmed[0] +
    '*'.repeat(trimmed.length - 2) +
    trimmed[trimmed.length - 1]
  );
}

@Injectable()
export class TrainingCertificateService {
  constructor(private prisma: PrismaService) {}

  private isAdmin(user: AuthUser) {
    return user.role === UserRole.OPERATOR || user.role === UserRole.SUPER_ADMIN;
  }

  private assertCanManage(program: { ownerId: string }, user: AuthUser) {
    if (this.isAdmin(user)) return;
    if (program.ownerId !== user.id) {
      throw new ForbiddenException('해당 교육 과정에 대한 권한이 없습니다.');
    }
  }

  private certPrefix() {
    return process.env.TRAINING_CERT_PREFIX ?? 'AQ-EDU';
  }

  private issuerName() {
    return process.env.TRAINING_CERT_ISSUER_NAME ?? 'AcademiQ';
  }

  /* 연도별 일련번호 채번. 호출부의 트랜잭션(tx) 안에서 실행해야 동시 발급에 안전하다. */
  private async nextCertificateNo(tx: any): Promise<string> {
    const year = Number(todayKstYmd().slice(0, 4));
    const counter = await tx.trainingCertificateCounter.upsert({
      where: { year },
      create: { year, lastSeq: 1 },
      update: { lastSeq: { increment: 1 } },
    });
    return `${this.certPrefix()}-${year}-${String(counter.lastSeq).padStart(4, '0')}`;
  }

  async listCertificates(user: AuthUser, programId: string) {
    const program = await this.prisma.trainingProgram.findUnique({
      where: { id: programId },
      select: { id: true, ownerId: true },
    });
    if (!program) throw new NotFoundException('교육 과정을 찾을 수 없습니다.');
    this.assertCanManage(program, user);

    const certificates = await this.prisma.trainingCertificate.findMany({
      where: { programId },
      orderBy: { issuedAt: 'desc' },
      include: {
        participant: { select: { id: true, name: true, status: true } },
        issuedBy: { select: { id: true, name: true } },
      },
    });
    return { certificates };
  }

  /* 일괄 발급: 참가자별 채번 + 스냅샷 저장, 참가자 상태 → COMPLETED */
  async issueCertificates(
    user: AuthUser,
    programId: string,
    participantIds: string[],
  ) {
    const program = await this.prisma.trainingProgram.findUnique({
      where: { id: programId },
      include: { _count: { select: { sessions: true } } },
    });
    if (!program) throw new NotFoundException('교육 과정을 찾을 수 없습니다.');
    this.assertCanManage(program, user);

    const participants = await this.prisma.trainingParticipant.findMany({
      where: { id: { in: participantIds }, programId },
      include: {
        certificates: {
          where: { status: TrainingCertificateStatus.ISSUED },
          select: { id: true },
        },
      },
    });
    if (participants.length !== participantIds.length) {
      throw new NotFoundException('해당 과정의 수강생이 아닌 대상이 있습니다.');
    }
    const already = participants.find((p) => p.certificates.length > 0);
    if (already) {
      throw new ConflictException(
        `이미 수료증이 발급된 수강생이 있습니다. (${already.name})`,
      );
    }

    // 발급 시점 출석률 스냅샷
    const rates = await this.computeRates(programId);

    const issued = await this.prisma.$transaction(async (tx) => {
      const results: {
        participantId: string;
        certificateId: string;
        certificateNo: string;
        issuedAt: Date;
      }[] = [];
      for (const p of participants) {
        const certificateNo = await this.nextCertificateNo(tx);
        const cert = await tx.trainingCertificate.create({
          data: {
            certificateNo,
            programId,
            participantId: p.id,
            participantName: p.name,
            programTitle: program.title,
            attendanceRate: rates.get(p.id) ?? null,
            issuedById: user.id,
          },
        });
        await tx.trainingParticipant.update({
          where: { id: p.id },
          data: { status: 'COMPLETED' },
        });
        results.push({
          participantId: p.id,
          certificateId: cert.id,
          certificateNo: cert.certificateNo,
          issuedAt: cert.issuedAt,
        });
      }
      return results;
    });

    return { issued };
  }

  private async computeRates(programId: string): Promise<Map<string, number | null>> {
    const today = todayKstYmd();
    const [sessions, attendances] = await Promise.all([
      this.prisma.trainingSession.findMany({
        where: { programId },
        select: { id: true, date: true },
      }),
      this.prisma.trainingAttendance.findMany({
        where: { session: { programId } },
        select: { participantId: true, sessionId: true, status: true },
      }),
    ]);
    const heldIds = new Set(
      sessions.filter((s) => toYmd(s.date) <= today).map((s) => s.id),
    );
    const counts = new Map<string, number>();
    for (const a of attendances) {
      if (!heldIds.has(a.sessionId)) continue;
      if (a.status === 'PRESENT' || a.status === 'LATE') {
        counts.set(a.participantId, (counts.get(a.participantId) ?? 0) + 1);
      }
    }
    const rates = new Map<string, number | null>();
    for (const [pid, attended] of counts) {
      rates.set(
        pid,
        heldIds.size > 0 ? Math.round((attended / heldIds.size) * 1000) / 10 : null,
      );
    }
    return rates;
  }

  private async getOwnedCertificate(certId: string, user: AuthUser) {
    const cert = await this.prisma.trainingCertificate.findUnique({
      where: { id: certId },
      include: {
        program: true,
        participant: { select: { id: true, name: true, affiliation: true } },
      },
    });
    if (!cert) throw new NotFoundException('수료증을 찾을 수 없습니다.');
    this.assertCanManage(cert.program, user);
    return cert;
  }

  async revoke(user: AuthUser, certId: string, reason?: string) {
    const cert = await this.getOwnedCertificate(certId, user);
    if (cert.status === TrainingCertificateStatus.REVOKED) {
      throw new ConflictException('이미 폐기된 수료증입니다.');
    }
    return this.prisma.trainingCertificate.update({
      where: { id: certId },
      data: {
        status: TrainingCertificateStatus.REVOKED,
        revokedAt: new Date(),
        revokeReason: reason ?? null,
      },
    });
  }

  /* 재발급: 구 수료증 폐기 + 새 번호로 발급, reissuedFromId 체인으로 이력 연결 */
  async reissue(user: AuthUser, certId: string) {
    const cert = await this.getOwnedCertificate(certId, user);
    if (cert.status === TrainingCertificateStatus.REVOKED) {
      throw new ConflictException('폐기된 수료증은 재발급할 수 없습니다.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.trainingCertificate.update({
        where: { id: certId },
        data: {
          status: TrainingCertificateStatus.REVOKED,
          revokedAt: new Date(),
          revokeReason: '재발급',
        },
      });
      const certificateNo = await this.nextCertificateNo(tx);
      return tx.trainingCertificate.create({
        data: {
          certificateNo,
          programId: cert.programId,
          participantId: cert.participantId,
          participantName: cert.participantName,
          programTitle: cert.programTitle,
          attendanceRate: cert.attendanceRate,
          issuedById: user.id,
          reissuedFromId: cert.id,
        },
      });
    });
  }

  async getCertificatePdf(user: AuthUser, certId: string) {
    const cert = await this.getOwnedCertificate(certId, user);
    if (cert.status === TrainingCertificateStatus.REVOKED) {
      throw new ConflictException('폐기된 수료증은 다운로드할 수 없습니다.');
    }
    const totalSessions = await this.prisma.trainingSession.count({
      where: { programId: cert.programId },
    });

    const buffer = await renderTrainingCertificatePdf({
      certificateNo: cert.certificateNo,
      participantName: cert.participantName,
      affiliation: cert.participant.affiliation,
      programTitle: cert.programTitle,
      periodStart: toYmd(cert.program.startDate),
      periodEnd: toYmd(cert.program.endDate),
      totalSessions,
      attendanceRate: cert.attendanceRate,
      issuedAt: cert.issuedAt,
      issuerName: this.issuerName(),
    });

    return {
      buffer,
      filename: `수료증_${cert.participantName}_${cert.certificateNo}.pdf`,
    };
  }

  /* 공개 진위확인 — 미존재/폐기 모두 valid:false 균일 응답(번호 열거 방지) */
  async verify(certificateNo: string) {
    const cert = await this.prisma.trainingCertificate.findUnique({
      where: { certificateNo: certificateNo.trim() },
      include: {
        program: { select: { startDate: true, endDate: true } },
      },
    });
    if (!cert || cert.status !== TrainingCertificateStatus.ISSUED) {
      return { valid: false as const };
    }
    return {
      valid: true as const,
      certificateNo: cert.certificateNo,
      participantName: maskName(cert.participantName),
      programTitle: cert.programTitle,
      periodStart: toYmd(cert.program.startDate),
      periodEnd: toYmd(cert.program.endDate),
      issuedAt: cert.issuedAt,
    };
  }
}
