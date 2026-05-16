'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { getAccessToken, redirectToLogin } from '@/lib/auth';
import { useAuthState } from '@/lib/use-auth-state';

interface ExamApplyButtonProps {
  sessionId: string;
  isOpen: boolean;
  statusLabel: string;
}

export function ExamApplyButton({ sessionId, isOpen, statusLabel }: ExamApplyButtonProps) {
  const router = useRouter();
  const isLoggedIn = useAuthState() === true;

  const applyPath = `/exam/${sessionId}/apply`;

  const handleClick = () => {
    if (!isOpen) return;
    if (!getAccessToken()) {
      redirectToLogin(router, applyPath);
      return;
    }
    router.push(applyPath);
  };

  return (
    <BrandButton
      variant={isOpen ? 'primary' : 'outline'}
      size="sm"
      disabled={!isOpen}
      onClick={handleClick}
    >
      {!isLoggedIn && isOpen ? '로그인 후 접수하기' : isOpen ? '접수하기' : statusLabel}
      <ArrowRight className="w-3.5 h-3.5" />
    </BrandButton>
  );
}
