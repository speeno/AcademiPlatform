'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandCard } from '@/components/ui/brand-card';
import { Input } from '@/components/ui/input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // 실제 API 연동 준비 중 — UI 흐름만 구현
    await new Promise((r) => setTimeout(r, 800));
    setSent(true);
    setLoading(false);
  };

  return (
    <BrandCard padding="lg" className="w-full max-w-md shadow-xl overflow-hidden">
      {/* 상단 브랜드 라인 */}
      <div
        className="h-1 -mx-6 -mt-6 mb-6"
        style={{
          background:
            'linear-gradient(90deg, #0F2771 0%, #1A9AC5 50%, #5AB85C 75%, #F5A023 100%)',
        }}
      />

      {sent ? (
        <div className="text-center py-6">
          <CheckCircle className="w-14 h-14 mx-auto mb-4 text-brand-green" />
          <h2 className="text-subheading text-foreground mb-2">이메일을 확인해 주세요</h2>
          <p className="text-sm text-muted-foreground mb-6">
            <span className="font-semibold text-foreground">{email}</span>으로<br />
            비밀번호 재설정 링크를 발송했습니다.
          </p>
          <Link href="/login">
            <BrandButton variant="outline" fullWidth>
              <ArrowLeft className="w-4 h-4 mr-1" /> 로그인으로 돌아가기
            </BrandButton>
          </Link>
        </div>
      ) : (
        <>
          <div className="text-center mb-6">
            <h1 className="text-heading text-brand-blue">비밀번호 찾기</h1>
            <p className="text-sm text-muted-foreground mt-1">
              가입 시 사용한 이메일을 입력하시면<br />비밀번호 재설정 링크를 보내드립니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">이메일</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <BrandButton type="submit" variant="primary" fullWidth loading={loading}>
              재설정 링크 보내기
            </BrandButton>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link href="/login" className="font-semibold text-brand-blue hover:text-brand-blue-dark">
              ← 로그인으로 돌아가기
            </Link>
          </p>
        </>
      )}
    </BrandCard>
  );
}
