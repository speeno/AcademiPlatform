'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, CalendarDays, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';
import { PageLoader } from '@/components/ui/page-loader';
import { ProgramStatusBadge } from '@/components/training/ProgramStatusBadge';
import { TrainingProgramProvider } from '@/components/training/program-context';
import { apiFetchWithAuth, parseJsonSafe } from '@/lib/api-client';
import { formatKoreanDate } from '@/lib/calendar';
import { cn } from '@/lib/utils';
import type { TrainingProgram } from '@/lib/training-types';

const TABS = [
  { segment: '', label: '개요' },
  { segment: 'sessions', label: '회차' },
  { segment: 'participants', label: '수강생' },
  { segment: 'attendance', label: '출석' },
  { segment: 'certificates', label: '수료증' },
] as const;

export default function ProgramDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const programId = params.id;
  const [program, setProgram] = useState<TrainingProgram | null>(null);

  const refresh = useCallback(async () => {
    const res = await apiFetchWithAuth(`/training/programs/${programId}`);
    if (!res.ok) {
      const data = await parseJsonSafe<{ message?: string }>(res, {});
      toast.error(data.message ?? '교육 과정을 불러오지 못했습니다.');
      router.replace('/training');
      return;
    }
    setProgram(await res.json());
  }, [programId, router]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!program) return <PageLoader />;

  const basePath = `/training/programs/${programId}`;

  return (
    <TrainingProgramProvider value={{ program, refresh }}>
      <div className="mx-auto max-w-5xl">
        <Link
          href="/training"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> 교육 일정
        </Link>

        {/* 프로그램 헤더 */}
        <div className="mb-5 space-y-2 border-b border-border pb-5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-heading text-brand-blue">{program.title}</h1>
            <ProgramStatusBadge status={program.status} />
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {formatKoreanDate(program.startDate)} ~ {formatKoreanDate(program.endDate)}
            </span>
            {program.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {program.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {program._count?.participants ?? 0}명
              {program.capacity ? ` / 정원 ${program.capacity}명` : ''}
            </span>
          </div>
        </div>

        {/* 탭 내비게이션 */}
        <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
          {TABS.map((tab) => {
            const href = tab.segment ? `${basePath}/${tab.segment}` : basePath;
            const active = pathname === href;
            return (
              <Link
                key={tab.segment}
                href={href}
                className={cn(
                  'whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'border-brand-blue text-brand-blue'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </TrainingProgramProvider>
  );
}
