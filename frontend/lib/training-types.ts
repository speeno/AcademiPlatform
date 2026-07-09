// 교육 운영(Training) 도메인 공유 타입 — 백엔드 /training API 응답 형태와 일치

export type TrainingProgramStatus =
  | 'DRAFT'
  | 'RECRUITING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type TrainingParticipantStatus = 'REGISTERED' | 'COMPLETED' | 'DROPPED';

export type TrainingAttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export const PROGRAM_STATUS_LABELS: Record<TrainingProgramStatus, string> = {
  DRAFT: '계획',
  RECRUITING: '모집중',
  IN_PROGRESS: '진행중',
  COMPLETED: '종료',
  CANCELLED: '취소',
};

export const PARTICIPANT_STATUS_LABELS: Record<TrainingParticipantStatus, string> = {
  REGISTERED: '등록',
  COMPLETED: '수료',
  DROPPED: '중도포기',
};

export const ATTENDANCE_STATUS_LABELS: Record<TrainingAttendanceStatus, string> = {
  PRESENT: '출석',
  LATE: '지각',
  ABSENT: '결석',
  EXCUSED: '공결',
};

export interface TrainingProgram {
  id: string;
  title: string;
  description?: string | null;
  courseId?: string | null;
  course?: { id: string; title: string; slug?: string } | null;
  owner?: { id: string; name: string };
  location?: string | null;
  capacity?: number | null;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: TrainingProgramStatus;
  /** 게시용 공유 토큰 — 있으면 /training-plan/{token} 으로 공개 중 */
  shareToken?: string | null;
  createdAt?: string;
  updatedAt?: string;
  sessions?: TrainingSession[];
  _count?: { sessions?: number; participants?: number; certificates?: number };
}

/** 공개 보기 전용 강의 계획 (/training/plans/:token 응답) */
export interface PublicTrainingPlan {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startDate: string;
  endDate: string;
  status: TrainingProgramStatus;
  sessions: TrainingSession[];
}

/** 메인 페이지 미니 달력용 공개 일정 항목 */
export interface PublicScheduleEvent {
  id: string;
  programId: string;
  programTitle: string;
  shareToken: string;
  sessionNo: number;
  date: string;
  startTime: string;
  endTime: string;
  topic?: string | null;
  location?: string | null;
}

export interface TrainingSession {
  id: string;
  programId: string;
  sessionNo: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  topic?: string | null;
  location?: string | null;
}

/** 프로그램별 전체 수업일 범위 — 달력 바를 월(그리드) 경계 밖까지 이어 그리는 데 사용 */
export interface CalendarProgramRange {
  programId: string;
  programTitle: string;
  firstDate: string; // YYYY-MM-DD
  lastDate: string; // YYYY-MM-DD
}

/** /training/calendar 피드 항목 */
export interface CalendarSessionEvent {
  id: string;
  programId: string;
  programTitle: string;
  programStatus: TrainingProgramStatus;
  sessionNo: number;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  topic?: string | null;
  location?: string | null;
}

export interface TrainingParticipant {
  id: string;
  userId?: string | null;
  type: 'MEMBER' | 'EXTERNAL';
  name: string;
  phone?: string | null;
  email?: string | null;
  affiliation?: string | null;
  status: TrainingParticipantStatus;
  note?: string | null;
  createdAt: string;
  attendance: { attended: number; held: number; rate: number | null };
  certificate?: { id: string; certificateNo: string; issuedAt: string } | null;
}

export interface TrainingCertificate {
  id: string;
  certificateNo: string;
  programId: string;
  participantId: string;
  participantName: string;
  programTitle: string;
  attendanceRate?: number | null;
  status: 'ISSUED' | 'REVOKED';
  issuedAt: string;
  revokedAt?: string | null;
  revokeReason?: string | null;
  participant?: { id: string; name: string; status: TrainingParticipantStatus };
  issuedBy?: { id: string; name: string } | null;
}

export interface AttendanceSummary {
  heldSessions: number;
  totalSessions: number;
  participants: {
    participantId: string;
    name: string;
    status: TrainingParticipantStatus;
    attended: number;
    held: number;
    rate: number | null;
  }[];
}
