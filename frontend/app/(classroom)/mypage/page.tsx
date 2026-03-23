'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Shield, Loader2, Save, ExternalLink, Pencil } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandCard, BrandCardTitle } from '@/components/ui/brand-card';
import { BrandBadge } from '@/components/ui/brand-badge';
import { buildAuthHeader } from '@/lib/auth';
import { API_BASE } from '@/lib/api-base';
import { toast } from 'sonner';

const roleLabel: Record<string, string> = {
  USER: '일반 회원',
  INSTRUCTOR: '강사',
  OPERATOR: '운영자',
  SUPER_ADMIN: '최고 관리자',
};

interface Me {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
}

interface MyVoucher {
  id: string;
  campaign: { name: string; provider: string };
  code: { code: string; status: string };
  course?: { title: string } | null;
  grantedAt: string;
}

export default function MyPagePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [vouchers, setVouchers] = useState<MyVoucher[]>([]);

  const loadMe = useCallback(async () => {
    try {
      const [meRes, voucherRes] = await Promise.all([
        fetch(`${API_BASE}/auth/me`, { credentials: 'include', headers: buildAuthHeader(false) }),
        fetch(`${API_BASE}/lms/vouchers/my`, { headers: buildAuthHeader(false), credentials: 'include' }),
      ]);
      if (meRes.ok) {
        const data = await meRes.json();
        setMe(data);
        setProfileForm({ name: data.name ?? '', phone: data.phone ?? '' });
      } else router.push('/login');
      if (voucherRes.ok) {
        setVouchers(await voucherRes.json());
      }
    } catch { router.push('/login'); }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    loadMe().finally(() => setLoading(false));
  }, [loadMe, router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'PATCH',
        headers: buildAuthHeader(),
        credentials: 'include',
        body: JSON.stringify({ name: profileForm.name.trim(), phone: profileForm.phone.trim() || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? '저장에 실패했습니다.');
      setMe(data);
      setEditing(false);
      toast.success('내 정보가 저장되었습니다.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '저장에 실패했습니다.';
      toast.error(message);
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePwChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { setPwMsg('새 비밀번호가 일치하지 않습니다.'); return; }
    setPwLoading(true);
    setPwMsg('비밀번호 변경은 준비 중입니다.');
    setPwLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--brand-blue)' }} />
      </div>
    );
  }

  if (!me) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--brand-blue)' }}>내 정보</h1>
        <p className="text-sm text-gray-500 mt-1">회원 정보를 확인하세요.</p>
      </div>

      <BrandCard accent="sky" padding="md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-semibold text-gray-900">교재를 별도로 구매하시나요?</p>
            <p className="text-sm text-gray-500 mt-1">주요 교재 구매 페이지에서 소장용 교재를 바로 구매할 수 있습니다.</p>
          </div>
          <Link href="/books">
            <BrandButton variant="outline" size="sm">
              주요 교재 구매
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </BrandButton>
          </Link>
        </div>
      </BrandCard>

      {/* 기본 정보 */}
      <BrandCard accent="blue" padding="lg">
        <div className="flex items-center justify-between mb-5">
          <BrandCardTitle>기본 정보</BrandCardTitle>
          {!editing ? (
            <BrandButton variant="ghost" size="sm" onClick={() => { setProfileForm({ name: me.name, phone: me.phone ?? '' }); setEditing(true); }}>
              <Pencil className="w-3.5 h-3.5 mr-1" />
              수정
            </BrandButton>
          ) : null}
        </div>
        {editing ? (
          <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">이름</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="이름"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">연락처</label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="010-0000-0000"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <BrandButton type="button" variant="outline" size="sm" onClick={() => { setEditing(false); setProfileForm({ name: me.name, phone: me.phone ?? '' }); }}>
                취소
              </BrandButton>
              <BrandButton type="submit" variant="secondary" size="sm" loading={profileSaving}>
                <Save className="w-3.5 h-3.5 mr-1" />
                저장
              </BrandButton>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--brand-blue-subtle)' }}>
                <User className="w-4 h-4" style={{ color: 'var(--brand-blue)' }} />
              </div>
              <div>
                <p className="text-xs text-gray-400">이름</p>
                <p className="font-semibold text-gray-800">{me.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--brand-blue-subtle)' }}>
                <Mail className="w-4 h-4" style={{ color: 'var(--brand-blue)' }} />
              </div>
              <div>
                <p className="text-xs text-gray-400">이메일</p>
                <p className="font-semibold text-gray-800">{me.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--brand-blue-subtle)' }}>
                <Phone className="w-4 h-4" style={{ color: 'var(--brand-blue)' }} />
              </div>
              <div>
                <p className="text-xs text-gray-400">연락처</p>
                <p className="font-semibold text-gray-800">{me.phone || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--brand-blue-subtle)' }}>
                <Shield className="w-4 h-4" style={{ color: 'var(--brand-blue)' }} />
              </div>
              <div>
                <p className="text-xs text-gray-400">역할</p>
                <BrandBadge variant="blue">{roleLabel[me.role] ?? me.role}</BrandBadge>
              </div>
            </div>
            <p className="text-xs text-gray-400 pt-2 border-t">
              가입일: {new Date(me.createdAt).toLocaleDateString('ko-KR')}
            </p>
          </div>
        )}
      </BrandCard>

      {/* 북이오 무료 이용권 */}
      <BrandCard accent="green" padding="lg">
        <BrandCardTitle className="mb-4">북이오 무료 이용권</BrandCardTitle>
        {vouchers.length === 0 ? (
          <p className="text-sm text-gray-500">지급된 이용권이 없습니다. 수강 신청 후 자동 지급될 수 있습니다.</p>
        ) : (
          <div className="space-y-3">
            {vouchers.map((voucher) => (
              <div key={voucher.id} className="rounded-lg border p-3 bg-white">
                <p className="text-sm font-semibold text-gray-800">{voucher.campaign.name}</p>
                <p className="text-xs text-gray-500 mt-1">코드: {voucher.code.code}</p>
                <p className="text-xs text-gray-500">연계 강좌: {voucher.course?.title ?? '공통'}</p>
                <p className="text-xs text-gray-400 mt-1">지급일: {new Date(voucher.grantedAt).toLocaleString('ko-KR')}</p>
              </div>
            ))}
          </div>
        )}
      </BrandCard>

      {/* 비밀번호 변경 */}
      <BrandCard accent="orange" padding="lg">
        <BrandCardTitle className="mb-5">비밀번호 변경</BrandCardTitle>
        <form onSubmit={handlePwChange} className="space-y-4">
          {[
            { label: '현재 비밀번호', key: 'current' },
            { label: '새 비밀번호', key: 'next' },
            { label: '새 비밀번호 확인', key: 'confirm' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="password"
                value={pwForm[key as keyof typeof pwForm]}
                onChange={(e) => setPwForm((p) => ({ ...p, [key]: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'var(--brand-blue)' } as React.CSSProperties}
                required
              />
            </div>
          ))}
          {pwMsg && <p className="text-sm text-amber-600">{pwMsg}</p>}
          <BrandButton type="submit" variant="secondary" loading={pwLoading} size="sm">
            <Save className="w-4 h-4 mr-1" /> 변경하기
          </BrandButton>
        </form>
      </BrandCard>
    </div>
  );
}
