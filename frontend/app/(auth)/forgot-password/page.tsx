'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import type { Metadata } from 'next';

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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {sent ? (
          <div className="text-center">
            <CheckCircle className="w-14 h-14 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">이메일을 확인해 주세요</h2>
            <p className="text-sm text-gray-500 mb-6">
              <span className="font-semibold text-gray-800">{email}</span>으로<br />
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
            <div className="text-center mb-8">
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">비밀번호 찾기</h1>
              <p className="text-sm text-gray-500">
                가입 시 사용한 이메일을 입력하시면<br />비밀번호 재설정 링크를 보내드립니다.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">이메일</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': 'var(--brand-blue)' } as React.CSSProperties}
                    required
                  />
                </div>
              </div>

              <BrandButton type="submit" variant="primary" fullWidth loading={loading}>
                재설정 링크 보내기
              </BrandButton>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              <Link href="/login" className="font-semibold" style={{ color: 'var(--brand-blue)' }}>
                ← 로그인으로 돌아가기
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
