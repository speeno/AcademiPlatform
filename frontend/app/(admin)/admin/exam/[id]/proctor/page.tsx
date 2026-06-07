'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandBadge } from '@/components/ui/brand-badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { ProctorSnapshotThumb } from '@/components/exam/ProctorSnapshotThumb';
import { apiFetchWithAuth, getApiUrl, parseJsonSafe } from '@/lib/api-client';

interface ProctorAttempt {
  id: string;
  status: string;
  startedAt: string;
  expiresAt: string;
  warningCount: number;
  user: { name: string; email: string };
  proctorEvents: Array<{ id: string; type: string; occurredAt: string }>;
  proctorSnapshots: Array<{ id: string; fileUrl: string; capturedAt: string }>;
}

export default function AdminExamProctorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [attempts, setAttempts] = useState<ProctorAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await apiFetchWithAuth(`/online-exam/admin/sessions/${id}/proctor`);
      if (res.ok) {
        const data = await parseJsonSafe<ProctorAttempt[]>(res, []);
        setAttempts(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const eventSource = new EventSource(
      getApiUrl(`/online-exam/admin/sessions/${id}/proctor/stream`),
      { withCredentials: true },
    );
    eventSource.addEventListener('proctor', (event) => {
      try {
        setAttempts(JSON.parse((event as MessageEvent).data));
        setLoading(false);
      } catch {
        // ignore malformed stream payload
      }
    });
    eventSource.onerror = () => {
      eventSource.close();
    };
    const timer = setInterval(load, 10000);
    return () => {
      eventSource.close();
      clearInterval(timer);
    };
  }, [id]);

  const columns: DataTableColumn<ProctorAttempt>[] = [
    {
      key: 'user',
      header: '응시자',
      cell: (a) => (
        <div>
          <p className="font-medium">{a.user.name}</p>
          <p className="text-xs text-muted-foreground">{a.user.email}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: '상태',
      cell: (a) => <BrandBadge variant={a.status === 'IN_PROGRESS' ? 'green' : 'default'}>{a.status}</BrandBadge>,
      className: 'w-32',
    },
    {
      key: 'warnings',
      header: '위험도',
      cell: (a) => <BrandBadge variant={a.warningCount > 0 ? 'orange' : 'green'}>이벤트 {a.warningCount}</BrandBadge>,
      className: 'w-28',
    },
    {
      key: 'events',
      header: '최근 이벤트',
      cell: (a) => (
        <div className="space-y-1 text-xs text-muted-foreground">
          {a.proctorEvents.length === 0 ? '-' : a.proctorEvents.slice(0, 3).map((event) => (
            <p key={event.id}>{event.type} · {new Date(event.occurredAt).toLocaleTimeString('ko-KR')}</p>
          ))}
        </div>
      ),
    },
    {
      key: 'snapshots',
      header: '스냅샷',
      cell: (a) => (
        <div className="flex flex-wrap gap-2">
          {a.proctorSnapshots.length === 0 ? (
            <span className="text-xs text-muted-foreground">스냅샷 없음</span>
          ) : a.proctorSnapshots.map((snapshot) => (
            <ProctorSnapshotThumb
              key={snapshot.id}
              fileUrl={snapshot.fileUrl}
              capturedAt={snapshot.capturedAt}
            />
          ))}
        </div>
      ),
      className: 'w-32',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BrandButton variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" /> 뒤로
        </BrandButton>
        <PageHeader title="온라인 시험 감독" description="감독 이벤트 스트림을 실시간으로 수신하고, 보조로 10초마다 동기화합니다." />
      </div>

      <DataTable
        columns={columns}
        rows={attempts}
        rowKey={(a) => a.id}
        loading={loading}
        empty={<p>응시 중인 사용자가 없습니다.</p>}
      />
    </div>
  );
}
