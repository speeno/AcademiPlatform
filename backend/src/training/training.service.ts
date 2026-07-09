import { randomBytes } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  TrainingAttendanceStatus,
  TrainingParticipantStatus,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateTrainingProgramDto,
  TrainingProgramFilterDto,
  UpdateTrainingProgramDto,
} from './dto/training-program.dto';
import {
  BulkCreateTrainingSessionsDto,
  CreateTrainingSessionDto,
  UpdateTrainingSessionDto,
} from './dto/training-session.dto';
import {
  AddTrainingParticipantDto,
  UpdateTrainingParticipantDto,
} from './dto/training-participant.dto';
import { BulkUpsertAttendanceDto } from './dto/training-attendance.dto';

type AuthUser = { id: string; role: UserRole | string };

// 출석 인정 상태(출석률 분자): 출석 + 지각
const ATTENDED_STATUSES: TrainingAttendanceStatus[] = [
  TrainingAttendanceStatus.PRESENT,
  TrainingAttendanceStatus.LATE,
];

export function toYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// 서버 TZ 와 무관하게 KST 기준 오늘 날짜(YYYY-MM-DD)
export function todayKstYmd(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

@Injectable()
export class TrainingService {
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

  private async getOwnedProgram(programId: string, user: AuthUser) {
    const program = await this.prisma.trainingProgram.findUnique({
      where: { id: programId },
    });
    if (!program) throw new NotFoundException('교육 과정을 찾을 수 없습니다.');
    this.assertCanManage(program, user);
    return program;
  }

  private serializeProgram<T extends { startDate: Date; endDate: Date }>(
    program: T,
  ) {
    return {
      ...program,
      startDate: toYmd(program.startDate),
      endDate: toYmd(program.endDate),
    };
  }

  private serializeSession<T extends { date: Date }>(session: T) {
    return { ...session, date: toYmd(session.date) };
  }

  /* ── 프로그램 ── */

  async listPrograms(user: AuthUser, filter: TrainingProgramFilterDto) {
    const { status, search, page = 1, limit = 50 } = filter;
    const where: Prisma.TrainingProgramWhereInput = {};
    if (!this.isAdmin(user)) where.ownerId = user.id;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [programs, total] = await Promise.all([
      this.prisma.trainingProgram.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startDate: 'desc' },
        include: {
          course: { select: { id: true, title: true } },
          owner: { select: { id: true, name: true } },
          _count: { select: { sessions: true, participants: true } },
        },
      }),
      this.prisma.trainingProgram.count({ where }),
    ]);

    return {
      programs: programs.map((p) => this.serializeProgram(p)),
      total,
      page,
      limit,
    };
  }

  async createProgram(user: AuthUser, dto: CreateTrainingProgramDto) {
    if (dto.startDate > dto.endDate) {
      throw new BadRequestException('종료일은 시작일 이후여야 합니다.');
    }
    if (dto.courseId) await this.assertCourseExists(dto.courseId);

    const program = await this.prisma.trainingProgram.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        courseId: dto.courseId ?? null,
        ownerId: user.id,
        location: dto.location ?? null,
        capacity: dto.capacity ?? null,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
    return this.serializeProgram(program);
  }

  async getProgram(user: AuthUser, id: string) {
    const program = await this.prisma.trainingProgram.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        owner: { select: { id: true, name: true } },
        sessions: { orderBy: [{ date: 'asc' }, { startTime: 'asc' }] },
        _count: {
          select: {
            participants: true,
            certificates: { where: { status: 'ISSUED' } },
          },
        },
      },
    });
    if (!program) throw new NotFoundException('교육 과정을 찾을 수 없습니다.');
    this.assertCanManage(program, user);

    return {
      ...this.serializeProgram(program),
      sessions: program.sessions.map((s) => this.serializeSession(s)),
    };
  }

  async updateProgram(user: AuthUser, id: string, dto: UpdateTrainingProgramDto) {
    const program = await this.getOwnedProgram(id, user);

    const startDate = dto.startDate ?? toYmd(program.startDate);
    const endDate = dto.endDate ?? toYmd(program.endDate);
    if (startDate > endDate) {
      throw new BadRequestException('종료일은 시작일 이후여야 합니다.');
    }

    // 기간 축소 시 기간 밖 회차가 있으면 거부(회차 먼저 정리하도록 유도)
    if (dto.startDate || dto.endDate) {
      const outOfRange = await this.prisma.trainingSession.count({
        where: {
          programId: id,
          OR: [
            { date: { lt: new Date(startDate) } },
            { date: { gt: new Date(endDate) } },
          ],
        },
      });
      if (outOfRange > 0) {
        throw new ConflictException(
          '변경한 기간 밖에 등록된 회차가 있습니다. 회차 일정을 먼저 수정해주세요.',
        );
      }
    }

    if (dto.courseId) await this.assertCourseExists(dto.courseId);

    const updated = await this.prisma.trainingProgram.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.courseId !== undefined && { courseId: dto.courseId }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.capacity !== undefined && { capacity: dto.capacity }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.status && { status: dto.status }),
      },
    });
    return this.serializeProgram(updated);
  }

  async deleteProgram(user: AuthUser, id: string) {
    await this.getOwnedProgram(id, user);
    const certCount = await this.prisma.trainingCertificate.count({
      where: { programId: id },
    });
    if (certCount > 0) {
      throw new ConflictException(
        '수료증이 발급된 과정은 삭제할 수 없습니다. 과정 상태를 종료로 변경해주세요.',
      );
    }
    await this.prisma.trainingProgram.delete({ where: { id } });
    return { success: true };
  }

  private async assertCourseExists(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });
    if (!course) throw new NotFoundException('연결할 강좌를 찾을 수 없습니다.');
  }

  /* 연계 강좌 검색(프로그램 폼용) */
  async searchCourses(search?: string) {
    const courses = await this.prisma.course.findMany({
      where: search
        ? { title: { contains: search, mode: 'insensitive' } }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, title: true },
    });
    return { courses };
  }

  /* ── 게시용 공유(보기 전용) ── */

  /** 공유 링크 발급(이미 있으면 기존 토큰 반환) */
  async enableShareLink(user: AuthUser, programId: string) {
    const program = await this.getOwnedProgram(programId, user);
    if (program.shareToken) return { shareToken: program.shareToken };
    const updated = await this.prisma.trainingProgram.update({
      where: { id: programId },
      data: { shareToken: randomBytes(18).toString('base64url') },
      select: { shareToken: true },
    });
    return { shareToken: updated.shareToken };
  }

  /** 공유 해제 — 기존 링크는 즉시 무효화된다 */
  async disableShareLink(user: AuthUser, programId: string) {
    await this.getOwnedProgram(programId, user);
    await this.prisma.trainingProgram.update({
      where: { id: programId },
      data: { shareToken: null },
    });
    return { success: true };
  }

  /** 공개 보기 전용 강의 계획 — 수강생 등 내부 정보는 제외한다 */
  async getSharedPlan(token: string) {
    const program = await this.prisma.trainingProgram.findUnique({
      where: { shareToken: token },
      include: {
        sessions: { orderBy: [{ date: 'asc' }, { startTime: 'asc' }] },
      },
    });
    if (!program) {
      throw new NotFoundException('공개된 강의 계획을 찾을 수 없습니다.');
    }
    return {
      id: program.id,
      title: program.title,
      description: program.description,
      location: program.location,
      startDate: toYmd(program.startDate),
      endDate: toYmd(program.endDate),
      status: program.status,
      sessions: program.sessions.map((s) => ({
        id: s.id,
        sessionNo: s.sessionNo,
        date: toYmd(s.date),
        startTime: s.startTime,
        endTime: s.endTime,
        topic: s.topic,
        location: s.location,
      })),
    };
  }

  /** 메인 페이지 위젯용 공개 일정 — 공유 활성 프로그램의 회차만 노출 */
  async getPublicSchedule(from?: string, to?: string) {
    const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
    if (!from || !to || !DATE_REGEX.test(from) || !DATE_REGEX.test(to)) {
      throw new BadRequestException('조회 기간(from/to)을 YYYY-MM-DD 형식으로 지정해주세요.');
    }
    const sessions = await this.prisma.trainingSession.findMany({
      where: {
        date: { gte: new Date(from), lte: new Date(to) },
        program: {
          shareToken: { not: null },
          status: { notIn: ['DRAFT', 'CANCELLED'] },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      include: {
        program: { select: { id: true, title: true, shareToken: true } },
      },
      take: 200,
    });
    return {
      sessions: sessions.map((s) => ({
        id: s.id,
        programId: s.program.id,
        programTitle: s.program.title,
        shareToken: s.program.shareToken,
        sessionNo: s.sessionNo,
        date: toYmd(s.date),
        startTime: s.startTime,
        endTime: s.endTime,
        topic: s.topic,
        location: s.location,
      })),
    };
  }

  /* ── 캘린더 피드 ── */

  async getCalendar(user: AuthUser, from?: string, to?: string) {
    const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
    if (!from || !to || !DATE_REGEX.test(from) || !DATE_REGEX.test(to)) {
      throw new BadRequestException('조회 기간(from/to)을 YYYY-MM-DD 형식으로 지정해주세요.');
    }
    const sessions = await this.prisma.trainingSession.findMany({
      where: {
        date: { gte: new Date(from), lte: new Date(to) },
        program: this.isAdmin(user) ? undefined : { ownerId: user.id },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      include: {
        program: { select: { id: true, title: true, status: true } },
      },
    });

    return {
      sessions: sessions.map((s) => ({
        id: s.id,
        programId: s.programId,
        programTitle: s.program.title,
        programStatus: s.program.status,
        sessionNo: s.sessionNo,
        date: toYmd(s.date),
        startTime: s.startTime,
        endTime: s.endTime,
        topic: s.topic,
        location: s.location,
      })),
    };
  }

  /* ── 회차 ── */

  private assertSessionInRange(
    dateYmd: string,
    program: { startDate: Date; endDate: Date },
  ) {
    if (dateYmd < toYmd(program.startDate) || dateYmd > toYmd(program.endDate)) {
      throw new BadRequestException(
        '회차 날짜는 교육 기간 내에 있어야 합니다.',
      );
    }
  }

  private assertTimeOrder(startTime: string, endTime: string) {
    if (endTime <= startTime) {
      throw new BadRequestException('종료 시간은 시작 시간 이후여야 합니다.');
    }
  }

  async addSession(user: AuthUser, programId: string, dto: CreateTrainingSessionDto) {
    const program = await this.getOwnedProgram(programId, user);
    this.assertSessionInRange(dto.date, program);
    this.assertTimeOrder(dto.startTime, dto.endTime);

    const last = await this.prisma.trainingSession.findFirst({
      where: { programId },
      orderBy: { sessionNo: 'desc' },
      select: { sessionNo: true },
    });

    const session = await this.prisma.trainingSession.create({
      data: {
        programId,
        sessionNo: (last?.sessionNo ?? 0) + 1,
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
        topic: dto.topic ?? null,
        location: dto.location ?? program.location,
      },
    });
    return this.serializeSession(session);
  }

  /**
   * 여러 날짜 일괄 등록(달력 드래그 선택).
   * 같은 날짜·시간대 중복 등록은 의도적으로 허용한다(반별 병행 수업 등) —
   * 입력 배열 내 중복 날짜만 제거하고, 순번은 날짜 오름차순으로 이어서 부여한다.
   */
  async addSessionsBulk(
    user: AuthUser,
    programId: string,
    dto: BulkCreateTrainingSessionsDto,
  ) {
    const program = await this.getOwnedProgram(programId, user);
    this.assertTimeOrder(dto.startTime, dto.endTime);

    const dates = [...new Set(dto.dates)].sort();
    const outOfRange = dates.filter(
      (d) => d < toYmd(program.startDate) || d > toYmd(program.endDate),
    );
    if (outOfRange.length > 0) {
      throw new BadRequestException(
        `교육 기간 밖의 날짜가 있습니다: ${outOfRange.join(', ')}`,
      );
    }

    const sessions = await this.prisma.$transaction(async (tx) => {
      const last = await tx.trainingSession.findFirst({
        where: { programId },
        orderBy: { sessionNo: 'desc' },
        select: { sessionNo: true },
      });
      let nextNo = (last?.sessionNo ?? 0) + 1;
      const created: { date: Date; [key: string]: unknown }[] = [];
      for (const date of dates) {
        created.push(
          await tx.trainingSession.create({
            data: {
              programId,
              sessionNo: nextNo++,
              date: new Date(date),
              startTime: dto.startTime,
              endTime: dto.endTime,
              topic: dto.topic ?? null,
              location: dto.location ?? program.location,
            },
          }),
        );
      }
      return created;
    });

    return { sessions: sessions.map((s) => this.serializeSession(s)) };
  }

  private async getOwnedSession(sessionId: string, user: AuthUser) {
    const session = await this.prisma.trainingSession.findUnique({
      where: { id: sessionId },
      include: { program: true },
    });
    if (!session) throw new NotFoundException('회차를 찾을 수 없습니다.');
    this.assertCanManage(session.program, user);
    return session;
  }

  async updateSession(user: AuthUser, sessionId: string, dto: UpdateTrainingSessionDto) {
    const session = await this.getOwnedSession(sessionId, user);
    const date = dto.date ?? toYmd(session.date);
    this.assertSessionInRange(date, session.program);
    this.assertTimeOrder(
      dto.startTime ?? session.startTime,
      dto.endTime ?? session.endTime,
    );

    const updated = await this.prisma.trainingSession.update({
      where: { id: sessionId },
      data: {
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.startTime && { startTime: dto.startTime }),
        ...(dto.endTime && { endTime: dto.endTime }),
        ...(dto.topic !== undefined && { topic: dto.topic }),
        ...(dto.location !== undefined && { location: dto.location }),
      },
    });
    return this.serializeSession(updated);
  }

  async deleteSession(user: AuthUser, sessionId: string) {
    await this.getOwnedSession(sessionId, user);
    await this.prisma.trainingSession.delete({ where: { id: sessionId } });
    return { success: true };
  }

  /* ── 회원 검색(참가자 등록용) ── */

  async searchUsers(query?: string) {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('검색어를 2자 이상 입력해주세요.');
    }
    const q = query.trim();
    const users = await this.prisma.user.findMany({
      where: {
        status: UserStatus.ACTIVE,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 10,
      select: { id: true, name: true, email: true },
    });
    return { users };
  }

  /* ── 참가자 ── */

  async listParticipants(user: AuthUser, programId: string) {
    await this.getOwnedProgram(programId, user);

    const [participants, summary] = await Promise.all([
      this.prisma.trainingParticipant.findMany({
        where: { programId },
        orderBy: { createdAt: 'asc' },
        include: {
          certificates: {
            where: { status: 'ISSUED' },
            select: { id: true, certificateNo: true, issuedAt: true },
          },
        },
      }),
      this.computeAttendanceSummary(programId),
    ]);

    return {
      participants: participants.map((p) => ({
        id: p.id,
        userId: p.userId,
        type: p.userId ? 'MEMBER' : 'EXTERNAL',
        name: p.name,
        phone: p.phone,
        email: p.email,
        affiliation: p.affiliation,
        status: p.status,
        note: p.note,
        createdAt: p.createdAt,
        attendance: summary.byParticipant[p.id] ?? {
          attended: 0,
          held: summary.heldSessions,
          rate: null,
        },
        certificate: p.certificates[0] ?? null,
      })),
    };
  }

  private normalizePhone(phone?: string | null) {
    return phone ? phone.replace(/\D/g, '') : '';
  }

  async addParticipant(
    user: AuthUser,
    programId: string,
    dto: AddTrainingParticipantDto,
  ) {
    const program = await this.getOwnedProgram(programId, user);

    // 정원 검사(등록/수료 상태만 카운트)
    if (program.capacity && !dto.allowOverCapacity) {
      const activeCount = await this.prisma.trainingParticipant.count({
        where: {
          programId,
          status: { not: TrainingParticipantStatus.DROPPED },
        },
      });
      if (activeCount >= program.capacity) {
        throw new ConflictException(
          `정원(${program.capacity}명)이 가득 찼습니다.`,
        );
      }
    }

    if (dto.userId) {
      // 회원 등록: 프로필 스냅샷 복사
      const member = await this.prisma.user.findUnique({
        where: { id: dto.userId },
        select: { id: true, name: true, email: true, phone: true },
      });
      if (!member) throw new NotFoundException('회원을 찾을 수 없습니다.');

      try {
        return await this.prisma.trainingParticipant.create({
          data: {
            programId,
            userId: member.id,
            name: member.name,
            email: member.email,
            phone: member.phone,
            affiliation: dto.affiliation ?? null,
            note: dto.note ?? null,
          },
        });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          throw new ConflictException('이미 등록된 수강생입니다.');
        }
        throw e;
      }
    }

    // 비회원 직접 등록
    if (!dto.name?.trim()) {
      throw new BadRequestException('이름을 입력해주세요.');
    }
    if (!dto.phone?.trim() && !dto.email?.trim()) {
      throw new BadRequestException('연락처 또는 이메일을 입력해주세요.');
    }

    // 비회원 중복: 동일 프로그램 내 이메일(소문자) 또는 전화번호(숫자만) 일치
    const email = dto.email?.trim().toLowerCase() || null;
    const phoneDigits = this.normalizePhone(dto.phone);
    const existing = await this.prisma.trainingParticipant.findMany({
      where: { programId },
      select: { id: true, name: true, email: true, phone: true },
    });
    const dup = existing.find(
      (p) =>
        (email && p.email?.toLowerCase() === email) ||
        (phoneDigits && this.normalizePhone(p.phone) === phoneDigits),
    );
    if (dup) {
      throw new ConflictException(
        `이미 등록된 수강생입니다. (${dup.name})`,
      );
    }

    return this.prisma.trainingParticipant.create({
      data: {
        programId,
        name: dto.name.trim(),
        phone: dto.phone?.trim() || null,
        email,
        affiliation: dto.affiliation ?? null,
        note: dto.note ?? null,
      },
    });
  }

  private async getOwnedParticipant(participantId: string, user: AuthUser) {
    const participant = await this.prisma.trainingParticipant.findUnique({
      where: { id: participantId },
      include: { program: true },
    });
    if (!participant) throw new NotFoundException('수강생을 찾을 수 없습니다.');
    this.assertCanManage(participant.program, user);
    return participant;
  }

  async updateParticipant(
    user: AuthUser,
    participantId: string,
    dto: UpdateTrainingParticipantDto,
  ) {
    const participant = await this.getOwnedParticipant(participantId, user);

    // 회원 참가자는 연락처 스냅샷을 임의 수정하지 않는다(비회원만 허용)
    if (participant.userId && (dto.name || dto.phone || dto.email)) {
      throw new BadRequestException(
        '회원 수강생의 이름/연락처는 수정할 수 없습니다.',
      );
    }

    return this.prisma.trainingParticipant.update({
      where: { id: participantId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.affiliation !== undefined && { affiliation: dto.affiliation }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.status && { status: dto.status }),
      },
    });
  }

  async removeParticipant(user: AuthUser, participantId: string) {
    await this.getOwnedParticipant(participantId, user);
    const certCount = await this.prisma.trainingCertificate.count({
      where: { participantId },
    });
    if (certCount > 0) {
      throw new ConflictException(
        '수료증이 발급된 수강생은 삭제할 수 없습니다. 수료증을 먼저 폐기해주세요.',
      );
    }
    await this.prisma.trainingParticipant.delete({
      where: { id: participantId },
    });
    return { success: true };
  }

  /* ── 출석 ── */

  async getSessionAttendance(user: AuthUser, sessionId: string) {
    const session = await this.getOwnedSession(sessionId, user);
    const [participants, records] = await Promise.all([
      this.prisma.trainingParticipant.findMany({
        where: { programId: session.programId },
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true, affiliation: true, status: true },
      }),
      this.prisma.trainingAttendance.findMany({
        where: { sessionId },
        select: { participantId: true, status: true, note: true },
      }),
    ]);

    const byParticipant = new Map(records.map((r) => [r.participantId, r]));
    return {
      session: this.serializeSession(session),
      records: participants.map((p) => ({
        participantId: p.id,
        name: p.name,
        affiliation: p.affiliation,
        participantStatus: p.status,
        status: byParticipant.get(p.id)?.status ?? null,
        note: byParticipant.get(p.id)?.note ?? null,
      })),
    };
  }

  async bulkUpsertAttendance(
    user: AuthUser,
    sessionId: string,
    dto: BulkUpsertAttendanceDto,
  ) {
    const session = await this.getOwnedSession(sessionId, user);

    const participantIds = dto.records.map((r) => r.participantId);
    const participants = await this.prisma.trainingParticipant.findMany({
      where: { id: { in: participantIds }, programId: session.programId },
      select: {
        id: true,
        certificates: {
          where: { status: 'ISSUED' },
          select: { id: true },
        },
      },
    });
    const validIds = new Set(participants.map((p) => p.id));
    const invalid = participantIds.find((id) => !validIds.has(id));
    if (invalid) {
      throw new BadRequestException('해당 과정의 수강생이 아닙니다.');
    }
    // 수료증 발급자 출석 수정 차단(출석률 스냅샷 정합성)
    const certified = participants.find((p) => p.certificates.length > 0);
    if (certified) {
      throw new ConflictException(
        '수료증이 발급된 수강생의 출석은 수정할 수 없습니다. 수료증을 먼저 폐기해주세요.',
      );
    }

    await this.prisma.$transaction(
      dto.records.map((r) =>
        this.prisma.trainingAttendance.upsert({
          where: {
            sessionId_participantId: {
              sessionId,
              participantId: r.participantId,
            },
          },
          create: {
            sessionId,
            participantId: r.participantId,
            status: r.status,
            note: r.note ?? null,
            checkedById: user.id,
          },
          update: {
            status: r.status,
            note: r.note ?? null,
            checkedById: user.id,
            checkedAt: new Date(),
          },
        }),
      ),
    );
    return { success: true, count: dto.records.length };
  }

  /* 참가자별 출석률: 분모 = 오늘(KST)까지 지나간 회차 수, 분자 = 출석+지각 */
  private async computeAttendanceSummary(programId: string) {
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

    const heldSessionIds = new Set(
      sessions.filter((s) => toYmd(s.date) <= today).map((s) => s.id),
    );
    const heldSessions = heldSessionIds.size;

    const byParticipant: Record<
      string,
      { attended: number; held: number; rate: number | null }
    > = {};
    for (const a of attendances) {
      if (!heldSessionIds.has(a.sessionId)) continue;
      const entry = (byParticipant[a.participantId] ??= {
        attended: 0,
        held: heldSessions,
        rate: null,
      });
      if (ATTENDED_STATUSES.includes(a.status)) entry.attended += 1;
    }
    for (const entry of Object.values(byParticipant)) {
      entry.rate =
        heldSessions > 0
          ? Math.round((entry.attended / heldSessions) * 1000) / 10
          : null;
    }
    return { heldSessions, totalSessions: sessions.length, byParticipant };
  }

  async getAttendanceSummary(user: AuthUser, programId: string) {
    await this.getOwnedProgram(programId, user);
    const summary = await this.computeAttendanceSummary(programId);
    const participants = await this.prisma.trainingParticipant.findMany({
      where: { programId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, status: true },
    });
    return {
      heldSessions: summary.heldSessions,
      totalSessions: summary.totalSessions,
      participants: participants.map((p) => ({
        participantId: p.id,
        name: p.name,
        status: p.status,
        ...(summary.byParticipant[p.id] ?? {
          attended: 0,
          held: summary.heldSessions,
          rate: summary.heldSessions > 0 ? 0 : null,
        }),
      })),
    };
  }
}
