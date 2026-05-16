'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandCard } from '@/components/ui/brand-card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { buildAuthHeader, getAccessToken, redirectToLogin } from '@/lib/auth';
import {
  getMemberDepositAccount,
  type ReferrerGroup,
} from '@/lib/referrer';
import {
  ExamApplySessionSummary,
  type ExamSessionSummaryData,
} from './ExamApplySessionSummary';
import { ExamDepositAccountInfo } from './ExamDepositAccountInfo';
import { API_BASE } from '@/lib/api-base';

const FORM_FIELDS = [
  { key: 'applicantName', label: '신청자 성명', required: true, type: 'text', placeholder: '홍길동' },
  { key: 'applicantNameEn', label: '영문 성명', required: true, type: 'text', placeholder: 'HONG GIL DONG' },
  { key: 'birthDate', label: '생년월일', required: true, type: 'date', placeholder: '' },
  { key: 'phone', label: '휴대폰', required: true, type: 'tel', placeholder: '010-0000-0000' },
  { key: 'email', label: '이메일', required: true, type: 'email', placeholder: 'example@email.com' },
  { key: 'address', label: '주소', required: true, type: 'text', placeholder: '서울시 강남구' },
  { key: 'occupation', label: '직업/소속', required: false, type: 'text', placeholder: '(주)회사명 또는 직업' },
  { key: 'experience', label: 'AI 관련 경력 (년)', required: false, type: 'number', placeholder: '0' },
];

export default function ExamApplyPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [step, setStep] = useState<'form' | 'payment' | 'complete'>('form');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<ExamSessionSummaryData | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [referrerGroups, setReferrerGroups] = useState<ReferrerGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedMemberCode, setSelectedMemberCode] = useState('');
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const applyPath = `/exam/${sessionId}/apply`;
    if (!getAccessToken()) {
      redirectToLogin(router, applyPath);
      return;
    }
    setAuthReady(true);
  }, [router, sessionId]);

  useEffect(() => {
    if (!authReady) return;

    const fetchSession = async () => {
      setSessionLoading(true);
      try {
        const res = await fetch(`${API_BASE}/exam/sessions/${sessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        setSessionInfo({
          qualificationName: data.qualificationName ?? '시험',
          roundName: data.roundName ?? '',
          examAt: data.examAt,
          place: data.place,
          applyStartAt: data.applyStartAt,
          applyEndAt: data.applyEndAt,
          fee: Number(data.fee) || 0,
        });
      } catch {
      } finally {
        setSessionLoading(false);
      }
    };

    const fetchReferrerGroups = async () => {
      try {
        const res = await fetch(`${API_BASE}/settings/public/referrer_groups`);
        if (!res.ok) return;
        const data = await res.json();
        const groups = Array.isArray(data?.value) ? data.value : [];
        setReferrerGroups(groups.filter((g: ReferrerGroup) => g.isActive !== false));
      } catch {}
    };

    fetchSession();
    fetchReferrerGroups();
  }, [sessionId, authReady]);

  const selectedGroup = referrerGroups.find((g) => g.id === selectedGroupId);
  const selectedMember = selectedGroup?.members.find((m) => m.code === selectedMemberCode);
  const depositAccount = getMemberDepositAccount(selectedMember);

  const handleFormChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedTerms) {
      toast.error('개인정보 수집 및 이용에 동의해주세요.');
      return;
    }
    setStep('payment');
  };

  const handleSubmitApplication = async () => {
    setLoading(true);
    try {
      const body = {
        ...formData,
        ...(selectedMemberCode ? { referrerCode: selectedMemberCode } : {}),
        depositAccount: {
          bank: depositAccount.bank,
          account: depositAccount.account,
          holder: depositAccount.holder,
          ...(depositAccount.sourceLabel ? { sourceLabel: depositAccount.sourceLabel } : {}),
        },
      };
      const res = await fetch(`${API_BASE}/exam/sessions/${sessionId}/apply`, {
        method: 'POST',
        headers: buildAuthHeader(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? '접수에 실패했습니다.');
      toast.success('시험 접수가 완료되었습니다.');
      setStep('complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '접수에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
        <p className="text-sm text-gray-500">로그인 확인 중...</p>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
        <BrandCard padding="lg" className="max-w-lg w-full text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'var(--brand-blue-subtle)' }}
          >
            <CheckCircle2 className="w-8 h-8" style={{ color: 'var(--brand-blue)' }} />
          </div>
          <h2 className="text-2xl font-extrabold mb-2" style={{ color: 'var(--brand-blue)' }}>
            접수 완료
          </h2>
          <p className="text-gray-600 mb-5">시험 접수가 완료되었습니다.</p>

          <div className="text-left mb-4">
            <ExamApplySessionSummary session={sessionInfo} />
          </div>

          <div className="text-left mb-6">
            <ExamDepositAccountInfo account={depositAccount} />
          </div>

          <BrandButton variant="primary" onClick={() => router.push('/mypage')} fullWidth>
            마이페이지 이동
          </BrandButton>
        </BrandCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-gradient py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-8">
          {['접수 정보', '접수 확인'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  (i === 0 && step === 'form') || (i === 1 && step === 'payment')
                    ? 'text-white'
                    : 'text-gray-400 bg-gray-100'
                }`}
                style={(i === 0 && step === 'form') || (i === 1 && step === 'payment')
                  ? { backgroundColor: 'var(--brand-orange)' } : {}}
              >
                {i + 1}
              </div>
              <span className={`text-sm font-medium ${step === (i === 0 ? 'form' : 'payment') ? 'text-gray-900' : 'text-gray-400'}`}>
                {label}
              </span>
              {i < 1 && <div className="w-8 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        <BrandCard padding="lg">
          <h1 className="text-2xl font-extrabold mb-2" style={{ color: 'var(--brand-blue)' }}>
            {step === 'form' ? '시험 접수 신청' : '접수 확인'}
          </h1>
          <p className="text-sm text-gray-500 mb-4">아래 시험에 대한 접수를 진행합니다.</p>

          <ExamApplySessionSummary session={sessionInfo} loading={sessionLoading} />

          {step === 'form' && (
            <form onSubmit={handleFormSubmit} className="space-y-5">
              {FORM_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="text-sm font-medium text-gray-700 mb-2.5 block">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <Input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formData[field.key] ?? ''}
                    onChange={(e) => handleFormChange(field.key, e.target.value)}
                    required={field.required}
                  />
                </div>
              ))}

              {referrerGroups.length > 0 && (
                <div className="rounded-lg border bg-gray-50 p-4 space-y-3">
                  <label className="text-sm font-medium text-gray-700 block">
                    신청 계기 <span className="text-gray-400 font-normal">(선택사항)</span>
                  </label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                    value={selectedGroupId}
                    onChange={(e) => {
                      setSelectedGroupId(e.target.value);
                      setSelectedMemberCode('');
                    }}
                  >
                    <option value="">없음</option>
                    {referrerGroups.map((g) => (
                      <option key={g.id} value={g.id}>{g.groupName}</option>
                    ))}
                  </select>
                  {selectedGroup && selectedGroup.members.length > 0 && (
                    <select
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                      value={selectedMemberCode}
                      onChange={(e) => setSelectedMemberCode(e.target.value)}
                    >
                      <option value="">선택하세요</option>
                      {selectedGroup.members.map((m) => (
                        <option key={m.code} value={m.code}>{m.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <ExamDepositAccountInfo account={depositAccount} />

              <div className="flex items-start gap-3 pt-3 border-t border-border">
                <input
                  type="checkbox"
                  id="agree"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="agree" className="text-sm text-gray-600 cursor-pointer">
                  [필수] 개인정보 수집 및 이용에 동의합니다. 수집된 개인정보는 시험 접수 및 운영 목적으로만 사용됩니다.
                </label>
              </div>

              <BrandButton type="submit" variant="primary" size="lg" fullWidth>
                다음 단계
              </BrandButton>
            </form>
          )}

          {step === 'payment' && (
            <div className="space-y-6">
              <ExamDepositAccountInfo account={depositAccount} />

              <div className="rounded-xl bg-gray-50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">신청자</span>
                  <span className="font-medium">{formData.applicantName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">이메일</span>
                  <span className="font-medium">{formData.email}</span>
                </div>
                {selectedMember && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">신청 계기</span>
                    <span className="font-medium">{selectedMember.label}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <BrandButton variant="outline" onClick={() => setStep('form')} size="lg" className="flex-1">
                  이전
                </BrandButton>
                <BrandButton variant="primary" onClick={handleSubmitApplication} loading={loading} size="lg" className="flex-1">
                  접수 완료
                </BrandButton>
              </div>
            </div>
          )}
        </BrandCard>
      </div>
    </div>
  );
}
