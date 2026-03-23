'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandCard } from '@/components/ui/brand-card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { setAccessToken } from '@/lib/auth';
import { API_BASE } from '@/lib/api-base';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    name: '', phone: '', agreedTerms: false, agreedPrivacy: false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!form.agreedTerms || !form.agreedPrivacy) {
      toast.error('필수 약관에 동의해주세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name,
          phone: form.phone,
          agreedTerms: form.agreedTerms ? 'Y' : 'N',
          agreedPrivacy: form.agreedPrivacy ? 'Y' : 'N',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? '회원가입에 실패했습니다.');

      setAccessToken(data.accessToken);
      toast.success('회원가입이 완료되었습니다.');
      router.push('/classroom');
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
          회원가입
        </h1>
        <p className="text-sm text-gray-500 mt-1">AcademiQ 계정을 만들어 시작하세요</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">이름 *</label>
          <Input placeholder="홍길동" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">이메일 *</label>
          <Input type="email" placeholder="example@email.com" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">휴대폰</label>
          <Input type="tel" placeholder="010-0000-0000" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">비밀번호 *</label>
          <Input type="password" placeholder="영문+숫자 8자 이상" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">비밀번호 확인 *</label>
          <Input type="password" placeholder="비밀번호 재입력" value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
        </div>

        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2">
            <Checkbox id="terms" checked={form.agreedTerms}
              onCheckedChange={(v) => setForm({ ...form, agreedTerms: !!v })} />
            <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
              <Link href="/terms" className="underline hover:text-brand-blue">[필수] 이용약관</Link> 동의
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="privacy" checked={form.agreedPrivacy}
              onCheckedChange={(v) => setForm({ ...form, agreedPrivacy: !!v })} />
            <label htmlFor="privacy" className="text-sm text-gray-600 cursor-pointer">
              <Link href="/privacy" className="underline hover:text-brand-blue">[필수] 개인정보처리방침</Link> 동의
            </label>
          </div>
        </div>

        <BrandButton type="submit" variant="primary" size="lg" fullWidth loading={loading}>
          <UserPlus className="w-4 h-4" />
          회원가입
        </BrandButton>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="font-semibold hover:underline" style={{ color: 'var(--brand-blue)' }}>
            로그인
          </Link>
        </p>
      </div>
    </BrandCard>
  );
}
