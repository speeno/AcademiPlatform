'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandCard } from '@/components/ui/brand-card';
import { Input } from '@/components/ui/input';
import { getPostLoginRedirect, setAccessToken } from '@/lib/auth';
import { API_BASE } from '@/lib/api-base';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? '로그인에 실패했습니다.');

      setAccessToken(data.accessToken);
      toast.success('로그인 되었습니다.');

      const nextPath =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('next')
          : null;
      router.push(getPostLoginRedirect(nextPath, data.user?.role));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
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
      <div className="text-center mb-6">
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--brand-blue)' }}>
          로그인
        </h1>
        <p className="text-sm text-gray-500 mt-1">AcademiQ 계정으로 로그인하세요</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">이메일</label>
          <Input
            type="email"
            placeholder="example@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">비밀번호</label>
          <div className="relative">
            <Input
              type={showPw ? 'text' : 'password'}
              placeholder="비밀번호 입력"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPw(!showPw)}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-gray-500 hover:underline">
            비밀번호를 잊으셨나요?
          </Link>
        </div>

        <BrandButton type="submit" variant="primary" size="lg" fullWidth loading={loading}>
          <LogIn className="w-4 h-4" />
          로그인
        </BrandButton>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          아직 회원이 아니신가요?{' '}
          <Link href="/register" className="font-semibold hover:underline" style={{ color: 'var(--brand-orange)' }}>
            회원가입
          </Link>
        </p>
      </div>
    </BrandCard>
  );
}
