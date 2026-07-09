'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, Download, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { BrandBadge } from '@/components/ui/brand-badge';
import { BrandButton } from '@/components/ui/brand-button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { useTrainingProgram } from '@/components/training/program-context';
import { apiFetchWithAuth, parseJsonSafe } from '@/lib/api-client';
import { formatKoreanDate } from '@/lib/calendar';
import type { TrainingParticipant } from '@/lib/training-types';

/** 수료증 탭 — 출석률 기준 선택 발급 + PDF 다운로드/재발급 */
export default function ProgramCertificatesPage() {
  const { program } = useTrainingProgram();
  const [participants, setParticipants] = useState<TrainingParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(80);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [issuing, setIssuing] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [reissuingId, setReissuingId] = useState<string | null>(null);

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

  const isEligible = useCallback(
    (p: TrainingParticipant) =>
      !p.certificate &&
      p.status !== 'DROPPED' &&
      p.attendance.rate != null &&
      p.attendance.rate >= threshold,
    [threshold],
  );

  const eligibleIds = useMemo(
    () => participants.filter(isEligible).map((p) => p.id),
    [participants, isEligible],
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) =>
      prev.size === eligibleIds.length ? new Set() : new Set(eligibleIds),
    );
  };

  const handleIssue = async () => {
    if (selected.size === 0) return;
    if (!confirm(`선택한 ${selected.size}명에게 수료증을 발급할까요?`)) return;
    setIssuing(true);
    try {
      const res = await apiFetchWithAuth(`/training/programs/${program.id}/certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantIds: [...selected] }),
      });
      if (!res.ok) {
        const data = await parseJsonSafe<{ message?: string }>(res, {});
        throw new Error(data.message ?? '수료증 발급에 실패했습니다.');
      }
      const data = await res.json();
      toast.success(`수료증 ${data.issued.length}건이 발급되었습니다.`);
      setSelected(new Set());
      await fetchParticipants();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIssuing(false);
    }
  };

  const handleDownload = async (p: TrainingParticipant) => {
    if (!p.certificate) return;
    setDownloadingId(p.certificate.id);
    try {
      const res = await apiFetchWithAuth(
        `/training/certificates/${p.certificate.id}/pdf`,
      );
      if (!res.ok) {
        const data = await parseJsonSafe<{ message?: string }>(res, {});
        throw new Error(data.message ?? 'PDF 다운로드에 실패했습니다.');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `수료증_${p.name}_${p.certificate.certificateNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleReissue = async (p: TrainingParticipant) => {
    if (!p.certificate) return;
    if (
      !confirm(
        `${p.name}님의 수료증을 재발급할까요?\n기존 번호(${p.certificate.certificateNo})는 폐기되고 새 번호가 발급됩니다.`,
      )
    ) {
      return;
    }
    setReissuingId(p.certificate.id);
    try {
      const res = await apiFetchWithAuth(
        `/training/certificates/${p.certificate.id}/reissue`,
        { method: 'POST' },
      );
      if (!res.ok) {
        const data = await parseJsonSafe<{ message?: string }>(res, {});
        throw new Error(data.message ?? '재발급에 실패했습니다.');
      }
      const cert = await res.json();
      toast.success(`재발급되었습니다. 새 번호: ${cert.certificateNo}`);
      await fetchParticipants();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setReissuingId(null);
    }
  };

  const columns: DataTableColumn<TrainingParticipant>[] = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={eligibleIds.length > 0 && selected.size === eligibleIds.length}
          onChange={toggleSelectAll}
          disabled={eligibleIds.length === 0}
          aria-label="전체 선택"
        />
      ),
      className: 'w-10',
      cell: (p) =>
        isEligible(p) ? (
          <input
            type="checkbox"
            checked={selected.has(p.id)}
            onChange={() => toggleSelect(p.id)}
            aria-label={`${p.name} 선택`}
          />
        ) : null,
    },
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
      key: 'rate',
      header: '출석률',
      cell: (p) =>
        p.attendance.rate == null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span
            className={
              p.attendance.rate >= threshold
                ? 'font-medium text-emerald-600'
                : 'text-red-500'
            }
          >
            {p.attendance.rate}%
          </span>
        ),
      className: 'w-24',
    },
    {
      key: 'certNo',
      header: '수료증 번호',
      cell: (p) =>
        p.certificate ? (
          <span className="font-mono text-xs text-brand-blue">
            {p.certificate.certificateNo}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">미발급</span>
        ),
    },
    {
      key: 'issuedAt',
      header: '발급일',
      cell: (p) =>
        p.certificate ? formatKoreanDate(p.certificate.issuedAt.slice(0, 10)) : '—',
      className: 'w-28',
      hideOnMobile: true,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-44 text-right',
      cell: (p) =>
        p.certificate ? (
          <div className="flex justify-end gap-1.5">
            <BrandButton
              variant="outline"
              size="sm"
              loading={downloadingId === p.certificate.id}
              onClick={() => handleDownload(p)}
            >
              <Download className="h-3.5 w-3.5" /> PDF
            </BrandButton>
            <BrandButton
              variant="ghost"
              size="sm"
              loading={reissuingId === p.certificate.id}
              onClick={() => handleReissue(p)}
            >
              <RotateCcw className="h-3.5 w-3.5" /> 재발급
            </BrandButton>
          </div>
        ) : null,
    },
  ];

  const issuedCount = participants.filter((p) => p.certificate).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="inline-flex items-center gap-2">
            수료 기준 출석률
            <input
              type="number"
              min={0}
              max={100}
              value={threshold}
              onChange={(e) => {
                setThreshold(Number(e.target.value));
                setSelected(new Set());
              }}
              className="w-20 rounded-lg border border-border px-2 py-1 text-sm"
            />
            % 이상
          </label>
          <BrandBadge variant="green">발급 {issuedCount}명</BrandBadge>
          <BrandBadge variant="blue">발급 가능 {eligibleIds.length}명</BrandBadge>
        </div>
        <BrandButton
          variant="primary"
          size="sm"
          loading={issuing}
          disabled={selected.size === 0}
          onClick={handleIssue}
        >
          <Award className="h-4 w-4" /> 선택 발급 ({selected.size}명)
        </BrandButton>
      </div>

      <DataTable
        columns={columns}
        rows={participants}
        rowKey={(p) => p.id}
        loading={loading}
        empty="등록된 수강생이 없습니다."
      />

      <p className="text-xs text-muted-foreground">
        발급 시 수강생 상태가 &lsquo;수료&rsquo;로 변경되고 출석률이 수료증에 기록됩니다. 수료증
        번호는 자동 채번되며, 진위확인 페이지(
        <span className="font-mono">/certificates/verify</span>)에서 누구나 확인할 수 있습니다.
      </p>
    </div>
  );
}
