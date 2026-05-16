import { Calendar, MapPin, Users, ClipboardList, Briefcase, CheckCircle2 } from 'lucide-react';
import { BrandCard } from '@/components/ui/brand-card';
import { BrandBadge } from '@/components/ui/brand-badge';
import { PriceDisplay } from '@/components/ui/price-display';
import { ExamApplyButton } from './ExamApplyButton';
import { ExamPageAuthRefresh } from './ExamPageAuthRefresh';
import type { Metadata } from 'next';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

interface QualificationEntry {
  keywords: string[];
  subtitle: string;
  coreWork: string;
  roles: string[];
  isActive?: boolean;
  order?: number;
}

const DEFAULT_QUALIFICATIONS: QualificationEntry[] = [
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
    subtitle: 'AI 크리에이터 전문가',
    coreWork: 'AI 도구를 활용한 콘텐츠 기획·제작 및 크리에이티브 업무',
    roles: [
      'AI 기반 이미지·영상·텍스트 콘텐츠 제작',
      '마케팅·브랜딩 콘텐츠 자동화 설계',
      '크리에이티브 워크플로우에 AI 도구 통합',
    ],
  },
];

export const metadata: Metadata = {
  title: '시험 접수',
  description: 'AI 자격 시험 일정을 확인하고 온라인으로 접수하세요.',
};

const STATUS_LABEL: Record<string, { text: string; variant: 'default' | 'blue' | 'orange' | 'green' | 'red' }> = {
  UPCOMING:  { text: '접수 예정', variant: 'default' },
  OPEN:      { text: '접수 중',   variant: 'green' },
  CLOSED:    { text: '마감',     variant: 'orange' },
  CANCELLED: { text: '취소',     variant: 'red' },
};

function getApiBase(): string {
  const explicit = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  const render = process.env.RENDER_EXTERNAL_URL?.trim();
  if (render) return `${render.replace(/\/+$/, '')}/api`;
  return 'http://localhost:4400/api';
}

async function getExamSessions() {
  try {
    const res = await fetchWithTimeout(
      `${getApiBase()}/exam/sessions`,
      { next: { revalidate: 60 } },
      8000,
    );
    if (!res.ok) return { sessions: [] };
    return res.json();
  } catch {
    return { sessions: [] };
  }
}

async function getQualificationIntros(): Promise<QualificationEntry[]> {
  try {
    const res = await fetchWithTimeout(
      `${getApiBase()}/settings/public/qualification_intros`,
      { next: { revalidate: 60 } },
      8000,
    );
    if (!res.ok) return DEFAULT_QUALIFICATIONS;
    const data = await res.json();
    const items = Array.isArray(data?.value) ? data.value : [];
    if (items.length === 0) return DEFAULT_QUALIFICATIONS;
    return items
      .filter((i: any) => i.isActive !== false)
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
  } catch {
    return DEFAULT_QUALIFICATIONS;
  }
}

function findQualInfo(qualifications: QualificationEntry[], name: string): QualificationEntry | undefined {
  return qualifications.find((q) => q.keywords.every((kw) => name.includes(kw)));
}

export default async function ExamPage() {
  const [{ sessions }, qualifications] = await Promise.all([
    getExamSessions(),
    getQualificationIntros(),
  ]);

  const qualNames: string[] = Array.isArray(sessions) && sessions.length > 0
    ? [...new Set<string>(sessions.map((s: any) => s.qualificationName as string))]
    : [];
  const matchedQualifications = qualNames
    .map((name) => ({ name, info: findQualInfo(qualifications, name) }))
    .filter((m): m is { name: string; info: QualificationEntry } => !!m.info);

  return (
    <>
      <ExamPageAuthRefresh />
      <section className="bg-hero-gradient py-14 border-b">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3" style={{ color: 'var(--brand-blue)' }}>
            시험 접수
          </h1>
          <p className="text-gray-600">AI 자격 시험 일정을 확인하고 온라인으로 접수하세요.</p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          {(!sessions || sessions.length === 0) ? (
            <div className="text-center py-20 text-gray-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>현재 등록된 시험이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {sessions.map((session: any) => {
                const statusInfo = STATUS_LABEL[session.status] ?? { text: session.status, variant: 'default' as const };
                const isOpen = session.status === 'OPEN';
                return (
                  <BrandCard key={session.id} hoverable padding="lg">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg text-gray-900">{session.qualificationName}</h3>
                          <BrandBadge variant="blue">{session.roundName}</BrandBadge>
                          <BrandBadge variant={statusInfo.variant}>{statusInfo.text}</BrandBadge>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            시험일: {new Date(session.examAt).toLocaleDateString('ko-KR')}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            {session.place ?? '장소 미정'}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            {session._count?.applications ?? 0}명 접수
                          </span>
                        </div>

                        <p className="text-xs text-gray-400 mt-1">
                          접수 기간: {new Date(session.applyStartAt).toLocaleDateString('ko-KR')} ~{' '}
                          {new Date(session.applyEndAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <PriceDisplay
                          price={Number(session.fee) || 0}
                          className="text-lg font-extrabold"
                          style={{ color: 'var(--brand-orange)' }}
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
        </div>
      </section>

      {matchedQualifications.length > 0 && (
        <section className="py-12 bg-gray-50 border-t">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-extrabold mb-8 text-center" style={{ color: 'var(--brand-blue)' }}>
              자격 소개
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {matchedQualifications.map(({ name, info }) => (
                  <BrandCard key={name} padding="lg">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{info.subtitle}</h3>
                    <div className="flex items-start gap-2 mb-4">
                      <Briefcase className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--brand-orange)' }} />
                      <div>
                        <p className="text-xs font-medium text-gray-500">업무 핵심</p>
                        <p className="text-sm text-gray-800 font-medium">{info.coreWork}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">가능한 역할</p>
                      <ul className="space-y-1.5">
                        {info.roles.map((role) => (
                          <li key={role} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-green-500" />
                            {role}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </BrandCard>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
