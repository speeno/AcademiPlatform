'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandCard } from '@/components/ui/brand-card';
import { Input } from '@/components/ui/input';
import {
  applyPostLoginNavigation,
  buildAuthHeader,
  getPostLoginRedirect,
  isLoggedIn,
  setAccessToken,
  setRefreshToken,
} from '@/lib/auth';
import { API_BASE } from '@/lib/api-base';
import { toast } from 'sonner';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) return;
    let cancelled = false;
    (async () => {
      const next = new URLSearchParams(window.location.search).get('next');
      let role: string | undefined;
      try {
        const res = await fetch(`${API_BASE}/auth/me`, { headers: buildAuthHeader(false) });
        if (res.ok) {
          const me = await res.json();
          role = me?.role;
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) {
        applyPostLoginNavigation(getPostLoginRedirect(next, role));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      if (data.refreshToken) setRefreshToken(data.refreshToken);
      toast.success('로그인 되었습니다.');

      const nextPath = new URLSearchParams(window.location.search).get('next');
      applyPostLoginNavigation(getPostLoginRedirect(nextPath, data.user?.role));
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
        <h1 className="text-heading text-brand-blue">로그인</h1>
        <p className="text-sm text-muted-foreground mt-1">AcademiQ 계정으로 로그인하세요</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">이메일</label>
          <Input
            type="email"
            placeholder="example@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">비밀번호</label>
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
              onClick={() => setShowPw(!showPw)}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-muted-foreground hover:underline">
            비밀번호를 잊으셨나요?
          </Link>
        </div>

        <BrandButton type="submit" variant="primary" size="lg" fullWidth loading={loading}>
          <LogIn className="w-4 h-4" />
          로그인
        </BrandButton>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          아직 회원이 아니신가요?{' '}
          <Link href="/register" className="font-semibold hover:underline text-brand-orange" >
            회원가입
          </Link>
        </p>
      </div>
    </BrandCard>
  );
}
