'use client';

import { useMemo } from 'react';
import { Calendar, MapPin, Users, ClipboardList, Briefcase, CheckCircle2 } from 'lucide-react';
import { BrandCard } from '@/components/ui/brand-card';
import { BrandBadge } from '@/components/ui/brand-badge';
import { PriceDisplay } from '@/components/ui/price-display';
import { ExamApplyButton } from '@/app/(public)/exam/ExamApplyButton';
import { PageShell } from '@/components/layout/PageShell';
import { ApiWarmupNotice } from '@/components/loading/ApiWarmupNotice';
import { useSlowApiFetch } from '@/lib/use-slow-api-fetch';
import {
  getExamModeBadgeVariant,
  getExamModeLabel,
  getExamPlaceLabel,
} from '@/lib/exam-mode';

const STATUS_LABEL: Record<string, { text: string; variant: 'default' | 'blue' | 'orange' | 'green' | 'red' }> = {
  UPCOMING: { text: '접수 예정', variant: 'default' },
  OPEN: { text: '접수 중', variant: 'green' },
  CLOSED: { text: '마감', variant: 'orange' },
  CANCELLED: { text: '취소', variant: 'red' },
};

export type QualificationEntry = {
  keywords: string[];
  subtitle: string;
  coreWork: string;
  roles: string[];
  isActive?: boolean;
  order?: number;
};

export const DEFAULT_QUALIFICATIONS: QualificationEntry[] = [
  {
    keywords: ['프롬프트', '엔지니어'],
    subtitle: 'AI 프롬프트 엔지니어',
    coreWork: '취업 및 AI 모델에 적합한 프롬프트 설계 및 최적화',
    roles: [
      '기업/교육기관에서 AI 활용 가이드 제작',
      '챗봇, 자동화 시스템의 대화 시나리오 설계',
      '데이터 분석 및 보고서 자동화 프롬프트 개발',
    ],
  },
  {
    keywords: ['교육', '지도'],
    subtitle: 'AI 교육지도사',
    coreWork: 'AI 활용 교육과 지도 및 컨설팅',
    roles: [
      '학교, 학원, 기업에서 AI 활용 교육 프로그램 운영',
      '교재·커리큘럼 개발 및 강의 진행',
      '기업 직원 AI 역량 강화 교육 및 AI 도입 컨설팅',
      '일반인 대상 AI 리터러시(활용법, 윤리, 안전) 교육',
    ],
  },
  {
    keywords: ['크리에이터'],
    subtitle: 'AI 크리에이터',
    coreWork: 'AI 도구를 활용한 콘텐츠 기획·제작 및 크리에이티브 업무',
    roles: [
      'AI 기반 이미지·영상·텍스트 콘텐츠 제작',
      '마케팅·브랜딩 콘텐츠 자동화 설계',
      '크리에이티브 워크플로우에 AI 도구 통합',
    ],
  },
];

type ExamSession = {
  id: string;
  qualificationName: string;
  roundName: string;
  status: string;
  examMode?: 'ONLINE' | 'OFFLINE' | 'HYBRID';
  examAt: string;
  place?: string | null;
  applyStartAt: string;
  applyEndAt: string;
  displayFee?: number | null;
  fee?: number | null;
  _count?: { applications?: number };
};

function parseSessions(json: unknown): ExamSession[] {
  const data = json as { sessions?: unknown };
  return Array.isArray(data?.sessions) ? (data.sessions as ExamSession[]) : [];
}

function parseQualificationIntros(json: unknown): QualificationEntry[] {
  const data = json as { value?: unknown };
  const items = Array.isArray(data?.value) ? data.value : [];
  if (items.length === 0) return DEFAULT_QUALIFICATIONS;
  return (items as QualificationEntry[])
    .filter((i) => i.isActive !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function findQualInfo(qualifications: QualificationEntry[], name: string): QualificationEntry | undefined {
  return qualifications.find((q) => q.keywords.every((kw) => name.includes(kw)));
}

function ExamLoadError({
  status,
  elapsedSeconds,
  onRetry,
}: {
  status: 'error' | 'timeout' | 'suspended';
  elapsedSeconds: number;
  onRetry: () => void;
}) {
  const messages: Record<typeof status, { title: string; desc: string }> = {
    suspended: {
      title: 'API 서버 연결 설정을 확인해 주세요.',
      desc: '백엔드 서비스가 중지된 주소로 연결되었을 수 있습니다. 운영팀에 문의해 주세요.',
    },
    timeout: {
      title: '아직 서버 준비가 끝나지 않았을 수 있습니다.',
      desc: '1분 정도 기다린 뒤 새로고침하거나 아래 버튼으로 다시 시도해 주세요.',
    },
    error: {
      title: '시험 정보를 일시적으로 불러올 수 없습니다.',
      desc: '잠시 후 다시 시도해 주세요.',
    },
  };
  const { title, desc } = messages[status];

  return (
    <div className="text-center py-20 text-muted-foreground">
      <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
      <p className="text-foreground font-medium">{title}</p>
      <p className="text-sm mt-1 max-w-md mx-auto">{desc}</p>
      {elapsedSeconds > 0 && (
        <p className="text-xs mt-2 text-muted-foreground">경과 {elapsedSeconds}초</p>
      )}
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 text-sm font-medium text-brand-blue hover:underline"
      >
        다시 시도
      </button>
    </div>
  );
}

export function ExamSessionsClient() {
  const sessionsFetch = useSlowApiFetch({
    path: '/exam/sessions',
    parse: parseSessions,
  });
  const qualFetch = useSlowApiFetch({
    path: '/settings/public/qualification_intros',
    parse: parseQualificationIntros,
  });

  const loading = sessionsFetch.status === 'loading' || sessionsFetch.status === 'idle';

  const elapsedSeconds = Math.max(sessionsFetch.elapsedSeconds, qualFetch.elapsedSeconds);

  const sessions = sessionsFetch.data ?? [];
  const qualifications =
    qualFetch.status === 'success' && qualFetch.data ? qualFetch.data : DEFAULT_QUALIFICATIONS;

  const matchedQualifications = useMemo(() => {
    const qualNames =
      sessions.length > 0
        ? [...new Set(sessions.map((s) => s.qualificationName))]
        : [];
    return qualNames
      .map((name) => ({ name, info: findQualInfo(qualifications, name) }))
      .filter((m): m is { name: string; info: QualificationEntry } => !!m.info);
  }, [sessions, qualifications]);

  const failedStatus =
    sessionsFetch.status === 'suspended'
      ? 'suspended'
      : sessionsFetch.status === 'timeout'
        ? 'timeout'
        : sessionsFetch.status === 'error'
          ? 'error'
          : null;

  const retry = () => {
    sessionsFetch.retry();
    qualFetch.retry();
  };

  return (
    <>
      <section className="py-12 bg-white">
        <PageShell flush>
          {loading ? (
            <ApiWarmupNotice elapsedSeconds={elapsedSeconds} />
          ) : failedStatus ? (
            <ExamLoadError
              status={failedStatus}
              elapsedSeconds={elapsedSeconds}
              onRetry={retry}
            />
          ) : sessions.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>현재 등록된 시험이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {sessions.map((session) => {
                const statusInfo = STATUS_LABEL[session.status] ?? {
                  text: session.status,
                  variant: 'default' as const,
                };
                const isOpen = session.status === 'OPEN';
                return (
                  <BrandCard key={session.id} hoverable padding="lg">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg text-foreground">{session.qualificationName}</h3>
                          <BrandBadge variant="blue">{session.roundName}</BrandBadge>
                          <BrandBadge variant={getExamModeBadgeVariant(session.examMode)}>
                            {getExamModeLabel(session.examMode)}
                          </BrandBadge>
                          <BrandBadge variant={statusInfo.variant}>{statusInfo.text}</BrandBadge>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            시험일: {new Date(session.examAt).toLocaleDateString('ko-KR')}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            {getExamPlaceLabel(session.examMode, session.place)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            {session._count?.applications ?? 0}명 접수
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground mt-1">
                          접수 기간: {new Date(session.applyStartAt).toLocaleDateString('ko-KR')} ~{' '}
                          {new Date(session.applyEndAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <PriceDisplay
                          price={
                            typeof session.displayFee === 'number'
                              ? session.displayFee
                              : typeof session.fee === 'number'
                                ? session.fee
                                : null
                          }
                          className="text-lg font-extrabold text-brand-orange"
                        />
                        <ExamApplyButton
                          sessionId={session.id}
                          isOpen={isOpen}
                          statusLabel={statusInfo.text}
                        />
                      </div>
                    </div>
                  </BrandCard>
                );
              })}
            </div>
          )}
        </PageShell>
      </section>

      {!loading && !failedStatus && matchedQualifications.length > 0 && (
        <section className="py-12 bg-muted/30 border-t">
          <PageShell flush>
            <h2 className="text-2xl font-extrabold mb-8 text-center text-brand-blue">자격 소개</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {matchedQualifications.map(({ name, info }) => (
                <BrandCard key={name} padding="lg">
                  <h3 className="text-lg font-bold text-foreground mb-2">{info.subtitle}</h3>
                  <div className="flex items-start gap-2 mb-4">
                    <Briefcase className="w-4 h-4 mt-0.5 flex-shrink-0 text-brand-orange" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">업무 핵심</p>
                      <p className="text-sm text-foreground font-medium">{info.coreWork}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">가능한 역할</p>
                    <ul className="space-y-1.5">
                      {info.roles.map((role) => (
                        <li key={role} className="flex items-start gap-2 text-sm text-foreground">
                          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-green-500" />
                          {role}
                        </li>
                      ))}
                    </ul>
                  </div>
                </BrandCard>
              ))}
            </div>
          </PageShell>
        </section>
      )}
    </>
  );
}
