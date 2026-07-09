'use client';

import { useState } from 'react';
import { Pencil, Plus, Printer, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { BrandButton } from '@/components/ui/brand-button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { SessionEditorModal } from '@/components/training/SessionEditorModal';
import { useTrainingProgram } from '@/components/training/program-context';
import { apiFetchWithAuth, parseJsonSafe } from '@/lib/api-client';
import { formatKoreanDateWithDay } from '@/lib/calendar';
import type { TrainingSession } from '@/lib/training-types';

/** 회차 탭 — 회차 일정 관리 */
export default function ProgramSessionsPage() {
  const { program, refresh } = useTrainingProgram();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingSession | null>(null);

  const sessions = program.sessions ?? [];

  const handleDelete = async (session: TrainingSession) => {
    if (!confirm(`${session.sessionNo}회차(${session.date})를 삭제할까요?\n해당 회차의 출석 기록도 함께 삭제됩니다.`)) {
      return;
    }
    const res = await apiFetchWithAuth(`/training/sessions/${session.id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await parseJsonSafe<{ message?: string }>(res, {});
      toast.error(data.message ?? '삭제에 실패했습니다.');
      return;
    }
    toast.success('회차가 삭제되었습니다.');
    await refresh();
  };

  const columns: DataTableColumn<TrainingSession>[] = [
    {
      key: 'no',
      header: '회차',
      cell: (s) => `${s.sessionNo}회차`,
      className: 'w-20',
    },
    {
      key: 'date',
      header: '날짜',
      cell: (s) => formatKoreanDateWithDay(s.date),
    },
    {
      key: 'time',
      header: '시간',
      cell: (s) => `${s.startTime} ~ ${s.endTime}`,
      className: 'w-36',
    },
    {
      key: 'topic',
      header: '주제',
      cell: (s) => s.topic ?? '—',
      hideOnMobile: true,
    },
    {
      key: 'location',
      header: '장소',
      cell: (s) => s.location ?? '—',
      hideOnMobile: true,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24 text-right',
      cell: (s) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => {
              setEditing(s);
              setEditorOpen(true);
            }}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="회차 수정"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(s)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
            aria-label="회차 삭제"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          총 {sessions.length}회차 · 교육 기간 내 날짜만 등록할 수 있습니다.
        </p>
        <div className="flex gap-2">
          <BrandButton
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(`/training/print/attendance/${program.id}`, '_blank')
            }
            disabled={sessions.length === 0}
          >
            <Printer className="h-4 w-4" /> 출석부 인쇄
          </BrandButton>
          <BrandButton
            variant="primary"
            size="sm"
            onClick={() => {
              setEditing(null);
              setEditorOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> 회차 추가
          </BrandButton>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={sessions}
        rowKey={(s) => s.id}
        empty="등록된 회차가 없습니다. '회차 추가'로 일정을 만들어보세요."
      />

      <SessionEditorModal
        open={editorOpen}
        programId={program.id}
        minDate={program.startDate}
        maxDate={program.endDate}
        session={editing}
        defaultLocation={program.location}
        onClose={() => setEditorOpen(false)}
        onSaved={() => void refresh()}
      />
    </div>
  );
}
