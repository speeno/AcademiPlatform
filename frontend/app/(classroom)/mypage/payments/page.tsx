'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard } from 'lucide-react';
import { PageLoader } from '@/components/ui/page-loader';
import { BrandBadge } from '@/components/ui/brand-badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { apiFetchWithAuth, getAccessToken } from '@/lib/api-client';

const targetTypeLabel: Record<string, string> = {
  ENROLLMENT:       '수강 신청',
  EXAM_APPLICATION: '시험 접수',
  TEXTBOOK:         '교재 구매',
};

const paymentStatusInfo: Record<string, { label: string; variant: 'default' | 'blue' | 'orange' | 'green' | 'red' }> = {
  PENDING:   { label: '결제 대기', variant: 'orange' },
  PAID:      { label: '결제 완료', variant: 'green' },
  FAILED:    { label: '결제 실패', variant: 'red' },
  CANCELLED: { label: '취소됨', variant: 'default' },
  REFUNDED:  { label: '환불 완료', variant: 'default' },
};

interface Payment {
  id: string;
  targetType: string;
  orderNo: string;
  amount: number;
  paymentStatus: string;
  paidAt: string | null;
  createdAt: string;
}

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      const token = getAccessToken();
      if (!token) { router.push('/login'); return; }
      try {
        const res = await apiFetchWithAuth('/payments/my');
        if (res.ok) setPayments(await res.json());
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetch_();
  }, [router]);

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader title="결제 내역" description="결제 및 환불 내역을 확인하세요." />

      {payments.length === 0 ? (
        <div className="text-center py-20">
          <CreditCard className="w-12 h-12 mx-auto mb-3 text-muted-foreground/60" />
          <p className="text-muted-foreground">결제 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const s = paymentStatusInfo[p.paymentStatus] ?? { label: p.paymentStatus, variant: 'default' as const };
            return (
              <div key={p.id} className="bg-card rounded-xl border border-border px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <BrandBadge variant={s.variant} className="text-xs">{s.label}</BrandBadge>
                    <span className="text-xs text-muted-foreground">{targetTypeLabel[p.targetType] ?? p.targetType}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">주문번호: {p.orderNo}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.paidAt
                      ? `결제일: ${new Date(p.paidAt).toLocaleDateString('ko-KR')}`
                      : `생성일: ${new Date(p.createdAt).toLocaleDateString('ko-KR')}`}
                  </p>
                </div>
                <span className="font-extrabold text-lg flex-shrink-0 text-brand-orange">
                  {p.amount.toLocaleString()}원
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
