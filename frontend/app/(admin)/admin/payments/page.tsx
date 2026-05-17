'use client';

import { useState, useEffect } from 'react';
import { Loader2, Search } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandBadge } from '@/components/ui/brand-badge';
import { apiFetchWithAuth } from '@/lib/api-client';

const targetTypeLabel: Record<string, string> = { ENROLLMENT: '수강 신청', EXAM_APPLICATION: '시험 접수', TEXTBOOK: '교재 구매' };
const paymentStatusInfo: Record<string, { label: string; variant: 'default' | 'orange' | 'green' | 'red' }> = {
  PENDING:   { label: '결제 대기', variant: 'orange' },
  PAID:      { label: '결제 완료', variant: 'green' },
  FAILED:    { label: '결제 실패', variant: 'red' },
  CANCELLED: { label: '취소됨', variant: 'default' },
  REFUNDED:  { label: '환불 완료', variant: 'default' },
};

interface Payment {
  id: string; orderNo: string; targetType: string; amount: number; paymentStatus: string;
  paidAt: string | null; createdAt: string;
  user: { name: string; email: string };
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (q) params.set('search', q);
      if (statusFilter) params.set('status', statusFilter);
      const res = await apiFetchWithAuth(`/payments/admin?${params}`);
      if (res.ok) { const d = await res.json(); setPayments(d.payments ?? []); setTotal(d.total ?? 0); }
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, statusFilter]);

  const totalAmount = payments.filter((p) => p.paymentStatus === 'PAID').reduce((acc, p) => acc + p.amount, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--brand-blue)' }}>결제 내역 관리</h1>
        <p className="text-sm text-gray-500 mt-1">총 {total}건 / 이 페이지 결제 합계: {totalAmount.toLocaleString()}원</p>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="이름, 이메일, 주문번호" className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">전체 상태</option>
          {Object.entries(paymentStatusInfo).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
        </select>
        <BrandButton variant="outline" size="sm" onClick={() => { setPage(1); load(); }}>검색</BrandButton>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--brand-blue)' }} /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['주문번호', '회원', '결제 유형', '금액', '상태', '결제일', '생성일'].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {payments.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">결제 내역이 없습니다.</td></tr>
              ) : payments.map((p) => {
                const si = paymentStatusInfo[p.paymentStatus] ?? { label: p.paymentStatus, variant: 'default' as const };
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">{p.orderNo}</td>
                    <td className="px-4 py-3"><p className="font-medium text-gray-800 text-xs">{p.user?.name}</p><p className="text-xs text-gray-400">{p.user?.email}</p></td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{targetTypeLabel[p.targetType] ?? p.targetType}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{p.amount.toLocaleString()}원</td>
                    <td className="px-4 py-3"><BrandBadge variant={si.variant} className="text-xs">{si.label}</BrandBadge></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.paidAt ? new Date(p.paidAt).toLocaleDateString('ko-KR') : '-'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(p.createdAt).toLocaleDateString('ko-KR')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {total > 20 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <BrandButton variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>이전</BrandButton>
          <span className="text-sm text-gray-500">{page} / {Math.ceil(total / 20)}</span>
          <BrandButton variant="outline" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)}>다음</BrandButton>
        </div>
      )}
    </div>
  );
}
