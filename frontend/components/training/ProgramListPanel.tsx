'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { ProgramStatusBadge } from '@/components/training/ProgramStatusBadge';
import { apiFetchWithAuth, parseJsonSafe } from '@/lib/api-client';
import { formatKoreanDate } from '@/lib/calendar';
import { programColor } from '@/lib/training-colors';
import {
  PROGRAM_STATUS_LABELS,
  type TrainingProgram,
  type TrainingProgramStatus,
} from '@/lib/training-types';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: { value: TrainingProgramStatus | ''; label: string }[] = [
  { value: '', label: '전체' },
  ...(Object.keys(PROGRAM_STATUS_LABELS) as TrainingProgramStatus[]).map((s) => ({
    value: s,
    label: PROGRAM_STATUS_LABELS[s],
  })),
];

/**
 * 달력 인터페이스에 통합된 강의 계획 목록 패널.
 * 목록의 컬러 도트는 달력 바 색과 동일하게 programId 로 배정된다.
 */
export function ProgramListPanel({ refreshKey = 0 }: { refreshKey?: number }) {
  const router = useRouter();
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [status, setStatus] = useState<TrainingProgramStatus | ''>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const qs = status ? `?status=${status}` : '';
      const res = await apiFetchWithAuth(`/training/programs${qs}`);
      if (!active) return;
      if (res.ok) {
        const data = await parseJsonSafe<{ programs: TrainingProgram[] }>(res, {
          programs: [],
        });
        setPrograms(data.programs);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [status, refreshKey]);

  const columns: DataTableColumn<TrainingProgram>[] = [
    {
      key: 'title',
      header: '과정명',
      cell: (p) => (
        <div className="flex items-center gap-2.5">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${programColor(p.id).dot}`}
            aria-hidden
          />
          <div>
            <p className="font-medium text-foreground">{p.title}</p>
            {p.course && (
              <p className="text-xs text-muted-foreground">연계: {p.course.title}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'period',
      header: '교육 기간',
      cell: (p) => `${formatKoreanDate(p.startDate)} ~ ${formatKoreanDate(p.endDate)}`,
      hideOnMobile: true,
    },
    {
      key: 'sessions',
      header: '회차',
      cell: (p) => `${p._count?.sessions ?? 0}회`,
      className: 'w-20',
      hideOnMobile: true,
    },
    {
      key: 'participants',
      header: '수강생',
      cell: (p) =>
        `${p._count?.participants ?? 0}${p.capacity ? ` / ${p.capacity}` : ''}명`,
      className: 'w-28',
    },
    {
      key: 'status',
      header: '상태',
      cell: (p) => <ProgramStatusBadge status={p.status} />,
      className: 'w-28',
    },
  ];

  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-foreground">강의 계획</h2>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatus(f.value)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                status === f.value
                  ? 'border-brand-blue bg-brand-blue text-white'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={programs}
        rowKey={(p) => p.id}
        loading={loading}
        onRowClick={(p) => router.push(`/training/programs/${p.id}`)}
        empty={
          <div className="space-y-3">
            <p>등록된 강의 계획이 없습니다.</p>
            <Link href="/training/programs/new" className="inline-block">
              <BrandButton variant="outline" size="sm">
                <Plus className="h-4 w-4" /> 첫 강의 계획 만들기
              </BrandButton>
            </Link>
          </div>
        }
      />
    </section>
  );
}
