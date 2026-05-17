'use client';

import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandBadge } from '@/components/ui/brand-badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { apiFetchWithAuth } from '@/lib/api-client';

const statusVariant: Record<string, 'default' | 'orange' | 'green'> = {
  OPEN: 'orange', IN_PROGRESS: 'orange', CLOSED: 'green',
};
const statusLabel: Record<string, string> = { OPEN: '미답변', IN_PROGRESS: '처리 중', CLOSED: '답변 완료' };

interface Inquiry {
  id: string; category: string; title: string; content: string;
  status: string; response: string | null; createdAt: string;
  user: { name: string; email: string };
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [response, setResponse] = useState('');
  const [responding, setResponding] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const load = async () => {
    try {
      const params = filter !== 'ALL' ? `?status=${filter}` : '';
      const res = await apiFetchWithAuth(`/admin/inquiries${params}`);
      if (res.ok) { const d = await res.json(); setInquiries(d.inquiries ?? d); }
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const handleRespond = async () => {
    if (!selected) return;
    setResponding(true);
    try {
      const res = await apiFetchWithAuth(`/admin/inquiries/${selected.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });
      if (res.ok) {
        setSelected(null);
        setResponse('');
        load();
      }
    } catch { /* ignore */ } finally { setResponding(false); }
  };

  const filterBar = (
    <div className="flex gap-2">
      {[['ALL', '전체'], ['OPEN', '미답변'], ['IN_PROGRESS', '처리 중'], ['CLOSED', '완료']].map(([v, l]) => (
        <button
          key={v}
          onClick={() => setFilter(v)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === v ? 'bg-brand-blue text-white' : 'bg-white border text-muted-foreground hover:bg-muted/30'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );

  const columns = [
    { key: 'user', header: '작성자', cell: (inq: Inquiry) => <div><p className="font-medium text-foreground text-xs">{inq.user?.name}</p><p className="text-xs text-muted-foreground">{inq.user?.email}</p></div>, className: 'w-36' },
    { key: 'category', header: '카테고리', cell: (inq: Inquiry) => <span className="text-xs text-muted-foreground">{inq.category}</span>, className: 'w-24' },
    { key: 'title', header: '제목', cell: (inq: Inquiry) => <span className="line-clamp-1">{inq.title}</span> },
    { key: 'status', header: '상태', cell: (inq: Inquiry) => <BrandBadge variant={statusVariant[inq.status] ?? 'default'} className="text-xs">{statusLabel[inq.status] ?? inq.status}</BrandBadge>, className: 'w-24' },
    { key: 'createdAt', header: '작성일', cell: (inq: Inquiry) => <span className="text-xs text-muted-foreground">{new Date(inq.createdAt).toLocaleDateString('ko-KR')}</span>, className: 'w-24', hideOnMobile: true },
    {
      key: 'actions', header: '', cell: (inq: Inquiry) => inq.status !== 'CLOSED' ? (
        <BrandButton variant="outline" size="sm" onClick={() => { setSelected(inq); setResponse(inq.response ?? ''); }}>답변</BrandButton>
      ) : null, className: 'w-16',
    },
  ];

  return (
    <div>
      <PageHeader
        title="1:1 문의 관리"
        description={`총 ${inquiries.length}건`}
        actions={filterBar}
      />

      <DataTable
        columns={columns}
        rows={inquiries}
        rowKey={(inq) => inq.id}
        loading={loading}
        empty={<p>문의가 없습니다.</p>}
      />

      {/* 답변 모달 */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold mb-1">문의 답변</h2>
            <p className="text-sm text-muted-foreground mb-4">{selected.user?.name} · {selected.category}</p>
            <div className="bg-muted/30 rounded-lg p-4 mb-4">
              <p className="font-medium text-foreground mb-2">{selected.title}</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selected.content}</p>
            </div>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="답변 내용을 입력해 주세요."
              rows={5}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <BrandButton variant="ghost" size="sm" onClick={() => setSelected(null)}>취소</BrandButton>
              <BrandButton variant="primary" size="sm" loading={responding} onClick={handleRespond}>
                <Send className="w-3.5 h-3.5 mr-1" /> 답변 발송
              </BrandButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
