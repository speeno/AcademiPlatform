'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Printer, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { BrandBadge } from '@/components/ui/brand-badge';
import { BrandButton } from '@/components/ui/brand-button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { ParticipantAddModal } from '@/components/training/ParticipantAddModal';
import { useTrainingProgram } from '@/components/training/program-context';
import { apiFetchWithAuth, parseJsonSafe } from '@/lib/api-client';
import { downloadCsv } from '@/lib/csv';
import {
  PARTICIPANT_STATUS_LABELS,
  type TrainingParticipant,
  type TrainingParticipantStatus,
} from '@/lib/training-types';

/** 수강생 탭 — 등록/상태 관리/CSV/명단 인쇄 */
export default function ProgramParticipantsPage() {
  const { program, refresh } = useTrainingProgram();
  const [participants, setParticipants] = useState<TrainingParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchParticipants = useCallback(async () => {
    const res = await apiFetchWithAuth(`/training/programs/${program.id}/participants`);
    if (res.ok) {
      const data = await parseJsonSafe<{ participants: TrainingParticipant[] }>(res, {
        participants: [],
      });
      setParticipants(data.participants);
    }
    setLoading(false);
  }, [program.id]);

  useEffect(() => {
    void fetchParticipants();
  }, [fetchParticipants]);

  const registeredUserIds = useMemo(
    () => new Set(participants.map((p) => p.userId).filter(Boolean) as string[]),
    [participants],
  );

  const handleStatusChange = async (
    participant: TrainingParticipant,
    status: TrainingParticipantStatus,
  ) => {
    const res = await apiFetchWithAuth(`/training/participants/${participant.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await parseJsonSafe<{ message?: string }>(res, {});
      toast.error(data.message ?? '상태 변경에 실패했습니다.');
      return;
    }
    toast.success('상태가 변경되었습니다.');
    await fetchParticipants();
  };

  const handleDelete = async (participant: TrainingParticipant) => {
    if (!confirm(`${participant.name}님을 수강생 명단에서 삭제할까요?`)) return;
    const res = await apiFetchWithAuth(`/training/participants/${participant.id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await parseJsonSafe<{ message?: string }>(res, {});
      toast.error(data.message ?? '삭제에 실패했습니다.');
      return;
    }
    toast.success('삭제되었습니다.');
    await Promise.all([fetchParticipants(), refresh()]);
  };

  const handleCsvDownload = () => {
    downloadCsv(
      `수강생명단_${program.title}.csv`,
      ['번호', '이름', '구분', '이메일', '연락처', '소속', '상태', '출석률(%)', '수료증번호'],
      participants.map((p, i) => [
        i + 1,
        p.name,
        p.type === 'MEMBER' ? '회원' : '비회원',
        p.email ?? '',
        p.phone ?? '',
        p.affiliation ?? '',
        PARTICIPANT_STATUS_LABELS[p.status],
        p.attendance.rate ?? '',
        p.certificate?.certificateNo ?? '',
      ]),
    );
  };

  const columns: DataTableColumn<TrainingParticipant>[] = [
    {
      key: 'name',
      header: '이름',
      cell: (p) => (
        <div>
          <p className="font-medium text-foreground">{p.name}</p>
          {p.affiliation && (
            <p className="text-xs text-muted-foreground">{p.affiliation}</p>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: '구분',
      cell: (p) => (
        <BrandBadge variant={p.type === 'MEMBER' ? 'blue' : 'gray'}>
          {p.type === 'MEMBER' ? '회원' : '비회원'}
        </BrandBadge>
      ),
      className: 'w-24',
    },
    {
      key: 'contact',
      header: '연락처',
      cell: (p) => (
        <div className="text-xs">
          {p.email && <p>{p.email}</p>}
          {p.phone && <p className="text-muted-foreground">{p.phone}</p>}
          {!p.email && !p.phone && '—'}
        </div>
      ),
      hideOnMobile: true,
    },
    {
      key: 'attendance',
      header: '출석률',
      cell: (p) =>
        p.attendance.rate == null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span
            className={
              p.attendance.rate >= 80 ? 'font-medium text-emerald-600' : 'text-foreground'
            }
          >
            {p.attendance.rate}%
            <span className="ml-1 text-xs text-muted-foreground">
              ({p.attendance.attended}/{p.attendance.held})
            </span>
          </span>
        ),
      className: 'w-32',
    },
    {
      key: 'status',
      header: '상태',
      cell: (p) => (
        <select
          value={p.status}
          onChange={(e) =>
            handleStatusChange(p, e.target.value as TrainingParticipantStatus)
          }
          className="rounded-lg border border-border bg-card px-2 py-1 text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          {(
            Object.keys(PARTICIPANT_STATUS_LABELS) as TrainingParticipantStatus[]
          ).map((s) => (
            <option key={s} value={s}>
              {PARTICIPANT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      ),
      className: 'w-28',
    },
    {
      key: 'cert',
      header: '수료증',
      cell: (p) =>
        p.certificate ? (
          <span className="text-xs text-brand-blue">{p.certificate.certificateNo}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
      hideOnMobile: true,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-14 text-right',
      cell: (p) => (
        <button
          type="button"
          onClick={() => handleDelete(p)}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
          aria-label="수강생 삭제"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          총 {participants.length}명
          {program.capacity ? ` / 정원 ${program.capacity}명` : ''}
        </p>
        <div className="flex flex-wrap gap-2">
          <BrandButton
            variant="outline"
            size="sm"
            onClick={handleCsvDownload}
            disabled={participants.length === 0}
          >
            <Download className="h-4 w-4" /> CSV 다운로드
          </BrandButton>
          <BrandButton
            variant="outline"
            size="sm"
            onClick={() => window.open(`/training/print/roster/${program.id}`, '_blank')}
            disabled={participants.length === 0}
          >
            <Printer className="h-4 w-4" /> 명단 인쇄
          </BrandButton>
          <BrandButton variant="primary" size="sm" onClick={() => setModalOpen(true)}>
            <UserPlus className="h-4 w-4" /> 수강생 등록
          </BrandButton>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={participants}
        rowKey={(p) => p.id}
        loading={loading}
        empty="등록된 수강생이 없습니다. '수강생 등록'으로 회원 또는 비회원을 추가하세요."
      />

      <ParticipantAddModal
        open={modalOpen}
        programId={program.id}
        registeredUserIds={registeredUserIds}
        onClose={() => setModalOpen(false)}
        onAdded={() => {
          void fetchParticipants();
          void refresh();
        }}
      />
    </div>
  );
}
