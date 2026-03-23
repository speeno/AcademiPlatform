'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandButton } from '@/components/ui/brand-button';
import { runPortOneCheckout } from '@/lib/payment';
import { buildAuthHeader } from '@/lib/auth';
import { toast } from 'sonner';

interface Props {
  courseId: string;
  price: number;
}

export default function EnrollButton({ courseId, price }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEnroll = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    setLoading(true);
    try {
      if (price > 0) {
        await runPortOneCheckout({
          targetType: 'ENROLLMENT',
          targetId: courseId,
          amountHint: price,
          name: '강의 수강 결제',
        });
        toast.success('결제가 완료되었습니다. 강의실로 이동합니다.');
        router.push('/classroom');
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: buildAuthHeader(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? '수강 신청에 실패했습니다.');
      }
      toast.success('무료 수강 신청이 완료되었습니다.');
      router.push('/classroom');
    } catch (err: any) {
      toast.error(err?.message ?? '결제 또는 수강 신청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BrandButton variant="primary" fullWidth loading={loading} onClick={handleEnroll} size="lg">
      {price === 0 ? '무료 수강 신청' : '수강 및 전자책 구매'}
    </BrandButton>
  );
}
