import Link from 'next/link';
import { Calendar, MapPin, Users, ArrowRight, ClipboardList } from 'lucide-react';
import { BrandCard } from '@/components/ui/brand-card';
import { BrandBadge } from '@/components/ui/brand-badge';
import { BrandButton } from '@/components/ui/brand-button';
import type { Metadata } from 'next';

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
    const res = await fetch(
      `${getApiBase()}/exam/sessions`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return { sessions: [] };
    return res.json();
  } catch {
    return { sessions: [] };
  }
}

export default async function ExamPage() {
  const { sessions } = await getExamSessions();

  return (
    <div>
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
                        <span className="text-lg font-extrabold" style={{ color: 'var(--brand-orange)' }}>
                          {session.fee === 0 ? '무료' : `${session.fee.toLocaleString()}원`}
                        </span>
                        <Link href={`/exam/${session.id}/apply`}>
                          <BrandButton
                            variant={isOpen ? 'primary' : 'outline'}
                            size="sm"
                            disabled={!isOpen}
                          >
                            {isOpen ? '접수하기' : statusInfo.text}
                            <ArrowRight className="w-3.5 h-3.5" />
                          </BrandButton>
                        </Link>
                      </div>
                    </div>
                  </BrandCard>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
