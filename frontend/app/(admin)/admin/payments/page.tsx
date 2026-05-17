'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandBadge } from '@/components/ui/brand-badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
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

  const columns: DataTableColumn<Payment>[] = [
    { key: 'orderNo', header: '주문번호', cell: (p) => <span className="text-xs font-mono text-muted-foreground">{p.orderNo}</span>, className: 'w-36', hideOnMobile: true },
    { key: 'user', header: '회원', cell: (p) => <div><p className="font-medium text-xs">{p.user?.name}</p><p className="text-xs text-muted-foreground">{p.user?.email}</p></div>, className: 'w-44' },
    { key: 'type', header: '유형', cell: (p) => <span className="text-xs text-muted-foreground">{targetTypeLabel[p.targetType] ?? p.targetType}</span>, className: 'w-28', hideOnMobile: true },
    { key: 'amount', header: '금액', cell: (p) => <span className="font-semibold">{p.amount.toLocaleString()}원</span>, className: 'w-28' },
    { key: 'status', header: '상태', cell: (p) => { const si = paymentStatusInfo[p.paymentStatus] ?? { label: p.paymentStatus, variant: 'default' as const }; return <BrandBadge variant={si.variant} className="text-xs">{si.label}</BrandBadge>; }, className: 'w-24' },
    { key: 'paidAt', header: '결제일', cell: (p) => <span className="text-xs text-muted-foreground">{p.paidAt ? new Date(p.paidAt).toLocaleDateString('ko-KR') : '-'}</span>, className: 'w-24', hideOnMobile: true },
    { key: 'createdAt', header: '생성일', cell: (p) => <span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString('ko-KR')}</span>, className: 'w-24', hideOnMobile: true },
  ];

  const filterBar = (
    <div className="flex gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="이름, 이메일, 주문번호" className="pl-9 pr-3 py-2 border rounded-lg text-sm" />
      </div>
      <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm bg-white">
        <option value="">전체 상태</option>
        {Object.entries(paymentStatusInfo).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
      </select>
      <BrandButton variant="outline" size="sm" onClick={() => { setPage(1); load(); }}>검색</BrandButton>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="결제 내역 관리"
        description={`총 ${total}건 · 이 페이지 합계 ${totalAmount.toLocaleString()}원`}
        actions={filterBar}
      />

      <DataTable
        columns={columns}
        rows={payments}
        rowKey={(p) => p.id}
        loading={loading}
        empty={<p>결제 내역이 없습니다.</p>}
      />

      {total > 20 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <BrandButton variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>이전</BrandButton>
          <span className="text-sm text-muted-foreground">{page} / {Math.ceil(total / 20)}</span>
          <BrandButton variant="outline" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)}>다음</BrandButton>
        </div>
      )}
    </div>
  );
}
