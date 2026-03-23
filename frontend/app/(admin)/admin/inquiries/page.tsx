'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Loader2, Send } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandBadge } from '@/components/ui/brand-badge';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4400/api';

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

  const authHeader = (): Record<string, string> => {
    const t = localStorage.getItem('accessToken');
    const h: Record<string, string> = { 'Content-Type': 'application/json' }; if (t) h['Authorization'] = `Bearer ${t}`; return h;
  };

  const load = async () => {
    try {
      const params = filter !== 'ALL' ? `?status=${filter}` : '';
      const res = await fetch(`${API}/admin/inquiries${params}`, { headers: authHeader() });
      if (res.ok) { const d = await res.json(); setInquiries(d.inquiries ?? d); }
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const handleRespond = async () => {
    if (!selected) return;
    setResponding(true);
    try {
      const res = await fetch(`${API}/admin/inquiries/${selected.id}/respond`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ response }),
      });
      if (res.ok) {
        setSelected(null);
        setResponse('');
        load();
      }
    } catch { /* ignore */ } finally { setResponding(false); }
  };

  if (loading) return <div className="flex justify-center h-64 items-center"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--brand-blue)' }} /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--brand-blue)' }}>1:1 문의 관리</h1>
        <p className="text-sm text-gray-500 mt-1">총 {inquiries.length}건</p>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-4">
        {[['ALL', '전체'], ['OPEN', '미답변'], ['IN_PROGRESS', '처리 중'], ['CLOSED', '완료']].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === v ? 'text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
            style={filter === v ? { backgroundColor: 'var(--brand-blue)' } : {}}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['작성자', '카테고리', '제목', '상태', '작성일', ''].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {inquiries.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">문의가 없습니다.</td></tr>
            ) : inquiries.map((inq) => (
              <tr key={inq.id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><p className="font-medium text-gray-800 text-xs">{inq.user?.name}</p><p className="text-xs text-gray-400">{inq.user?.email}</p></td>
                <td className="px-4 py-3 text-gray-600 text-xs">{inq.category}</td>
                <td className="px-4 py-3 text-gray-800 line-clamp-1 max-w-xs">{inq.title}</td>
                <td className="px-4 py-3"><BrandBadge variant={statusVariant[inq.status] ?? 'default'} className="text-xs">{statusLabel[inq.status] ?? inq.status}</BrandBadge></td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(inq.createdAt).toLocaleDateString('ko-KR')}</td>
                <td className="px-4 py-3">
                  {inq.status !== 'CLOSED' && (
                    <BrandButton variant="outline" size="sm" onClick={() => { setSelected(inq); setResponse(inq.response ?? ''); }}>
                      답변
                    </BrandButton>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 답변 모달 */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold mb-1">문의 답변</h2>
            <p className="text-sm text-gray-500 mb-4">{selected.user?.name} · {selected.category}</p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="font-medium text-gray-800 mb-2">{selected.title}</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{selected.content}</p>
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
