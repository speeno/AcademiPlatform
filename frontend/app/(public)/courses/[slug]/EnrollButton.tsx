'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandButton } from '@/components/ui/brand-button';
import { buildAuthHeader, getAccessToken } from '@/lib/auth';
import { useAuthState } from '@/lib/use-auth-state';
import { toast } from 'sonner';

interface Props {
  courseId: string;
  // 가격은 상세 페이지에서 별도 표시(수강료 안내용). 신청은 결제 없이 승인제로 진행된다.
  price: number;
}

export default function EnrollButton({ courseId }: Props) {
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);
  const isLoggedIn = useAuthState() === true;
  const router = useRouter();

  const handleEnroll = async () => {
    const token = getAccessToken();
    if (!token) {
      router.push('/login');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: buildAuthHeader(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? '수강 신청에 실패했습니다.');
      }
      setRequested(true);
      toast.success('수강 신청이 접수되었습니다. 관리자 승인 후 수강할 수 있습니다.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '수강 신청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const buttonLabel = !isLoggedIn
    ? '로그인 후 수강 신청'
    : requested
      ? '승인 대기 중'
      : '수강 신청';

  return (
    <div className="space-y-2">
      <BrandButton
        variant="primary"
        fullWidth
        loading={loading}
        onClick={handleEnroll}
        size="lg"
        disabled={requested}
      >
        {buttonLabel}
      </BrandButton>
      <p className="text-center text-xs text-muted-foreground">
        신청 후 관리자 승인이 완료되면 수강이 시작됩니다.
      </p>
    </div>
  );
}
