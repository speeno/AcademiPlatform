import Link from 'next/link';
import { Calendar, MapPin, Users, ArrowRight, ClipboardList } from 'lucide-react';
import { BrandCard } from '@/components/ui/brand-card';
import { BrandBadge, StatusBadge } from '@/components/ui/brand-badge';
import { BrandButton } from '@/components/ui/brand-button';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '시험 접수',
  description: 'AI 자격 시험 일정을 확인하고 온라인으로 접수하세요.',
};

async function getExamSessions() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'}/exam/sessions`,
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

  const sampleSessions = sessions.length > 0 ? sessions : [
    {
      id: '1',
      qualificationName: 'AI 활용 전문가',
      roundName: '2026년 제1회',
      applyStartAt: '2026-03-01',
      applyEndAt: '2026-03-31',
      examAt: '2026-04-20',
      place: '서울 강남구',
      fee: 80000,
      status: 'OPEN',
      _count: { applications: 45 },
    },
    {
      id: '2',
      qualificationName: 'AI 교육 지도사',
      roundName: '2026년 제1회',
      applyStartAt: '2026-04-01',
      applyEndAt: '2026-04-30',
      examAt: '2026-05-18',
      place: '서울 강남구',
      fee: 90000,
      status: 'UPCOMING',
      _count: { applications: 12 },
    },
  ];

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
          {sampleSessions.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>현재 접수 가능한 시험이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {sampleSessions.map((session: any) => (
                <BrandCard key={session.id} hoverable padding="lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg text-gray-900">{session.qualificationName}</h3>
                        <BrandBadge variant="blue">{session.roundName}</BrandBadge>
                        <StatusBadge
                          status={session.status === 'OPEN' ? '접수완료' : session.status === 'UPCOMING' ? '진행중' : '마감'}
                        />
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
                          variant={session.status === 'OPEN' ? 'primary' : 'outline'}
                          size="sm"
                          disabled={session.status !== 'OPEN'}
                        >
                          {session.status === 'OPEN' ? '접수하기' : '접수 예정'}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </BrandButton>
                      </Link>
                    </div>
                  </div>
                </BrandCard>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
