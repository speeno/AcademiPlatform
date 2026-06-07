'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardList, FileQuestion, ShieldCheck, SquarePen, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { BrandCard } from '@/components/ui/brand-card';
import { PageLoader } from '@/components/ui/page-loader';
import { API_BASE } from '@/lib/api-base';
import { buildAuthHeader } from '@/lib/auth';
import { parseJsonSafe } from '@/lib/api-client';

type Session = {
  id: string;
  qualificationName: string;
  roundName: string;
  examMode?: 'OFFLINE' | 'ONLINE' | 'HYBRID';
  examAt: string;
  _count?: { applications: number };
};

const API = API_BASE;

export default function AdminExamAuthoringPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/exam/admin/sessions?limit=100`, {
          headers: buildAuthHeader(false),
        });
        if (!res.ok) return;
        const data = await parseJsonSafe<any>(res, []);
        setSessions(data.sessions ?? data ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="시험 출제 관리"
        description="문제은행 문항 생성 후 회차별 시험지 구성·채점·감독까지 한 화면에서 이동합니다."
        actions={
          <Link
            href="/admin/exam/questions"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-logo-gradient px-4 text-xs font-bold text-white shadow-[0_12px_28px_rgba(7,59,120,0.18)]"
          >
            <FileQuestion className="h-4 w-4" />
            문제은행 열기
          </Link>
        }
      />

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <Link href="/admin/exam/questions" className="rounded-2xl border border-border bg-white p-4 hover:border-brand-blue/40">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-brand-blue">
            <FileQuestion className="h-4 w-4" />
            1) 문제은행
          </div>
          <p className="text-xs text-muted-foreground">AI 문항 등록/수정 및 정답 관리</p>
        </Link>
        <Link href="/admin/exam" className="rounded-2xl border border-border bg-white p-4 hover:border-brand-blue/40">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-brand-blue">
            <ClipboardList className="h-4 w-4" />
            2) 회차 선택
          </div>
          <p className="text-xs text-muted-foreground">시험 회차의 온라인 설정과 응시자 상태 확인</p>
        </Link>
        <div className="rounded-2xl border border-border bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-brand-blue">
            <CheckCircle2 className="h-4 w-4" />
            3) 시험지/채점/감독
          </div>
          <p className="text-xs text-muted-foreground">회차별 출제, 채점 확정, 감독 대시보드로 이동</p>
        </div>
      </div>

      <div className="space-y-3">
        {sessions.length === 0 ? (
          <BrandCard padding="md">
            <p className="text-sm text-muted-foreground">등록된 시험 회차가 없습니다. 먼저 시험 회차를 등록해주세요.</p>
          </BrandCard>
        ) : (
          sessions.map((session) => (
            <BrandCard key={session.id} padding="md">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {session.qualificationName} · {session.roundName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(session.examAt).toLocaleString('ko-KR')} ·{' '}
                    {session.examMode === 'ONLINE' ? '온라인' : session.examMode === 'HYBRID' ? '혼합' : '오프라인'} · 접수{' '}
                    {session._count?.applications ?? 0}명
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/exam/${session.id}/paper`}
                    className="inline-flex items-center gap-1 rounded-full border border-brand-blue/30 px-3 py-1.5 text-xs font-semibold text-brand-blue hover:bg-brand-blue-subtle"
                  >
                    <FileQuestion className="h-3.5 w-3.5" />
                    시험지 편집
                  </Link>
                  <Link
                    href={`/admin/exam/${session.id}/grading`}
                    className="inline-flex items-center gap-1 rounded-full border border-brand-blue/30 px-3 py-1.5 text-xs font-semibold text-brand-blue hover:bg-brand-blue-subtle"
                  >
                    <SquarePen className="h-3.5 w-3.5" />
                    채점
                  </Link>
                  <Link
                    href={`/admin/exam/${session.id}/proctor`}
                    className="inline-flex items-center gap-1 rounded-full border border-brand-blue/30 px-3 py-1.5 text-xs font-semibold text-brand-blue hover:bg-brand-blue-subtle"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    감독
                  </Link>
                  <Link
                    href={`/admin/exam/${session.id}/applications`}
                    className="inline-flex items-center gap-1 rounded-full border border-brand-blue/30 px-3 py-1.5 text-xs font-semibold text-brand-blue hover:bg-brand-blue-subtle"
                  >
                    <Users className="h-3.5 w-3.5" />
                    접수자
                  </Link>
                  <Link
                    href={`/admin/exam/${session.id}/results`}
                    className="inline-flex items-center gap-1 rounded-full border border-brand-blue/30 px-3 py-1.5 text-xs font-semibold text-brand-blue hover:bg-brand-blue-subtle"
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    결과
                  </Link>
                </div>
              </div>
            </BrandCard>
          ))
        )}
      </div>
    </div>
  );
}
