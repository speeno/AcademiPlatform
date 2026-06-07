'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandCard } from '@/components/ui/brand-card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  buildAuthHeader,
  ensureAuthCookieSync,
  fetchWithAuth,
  forceLogoutToLogin,
  getAccessToken,
  verifyAuthSession,
} from '@/lib/auth';
import {
  findReferrerMemberByCode,
  flattenReferrerOptions,
  getMemberDepositAccount,
  parseReferrerGroups,
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

const MAX_ID_PHOTO_BYTES = 10 * 1024 * 1024;
const ALLOWED_ID_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

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
  const [selectedMemberCode, setSelectedMemberCode] = useState('');
  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const sessionExamMode = sessionInfo?.examMode ?? 'OFFLINE';
  const availableExamModes =
    sessionExamMode === 'HYBRID'
      ? [
          { value: 'ONLINE', label: '온라인' },
          { value: 'OFFLINE', label: '오프라인' },
        ]
      : sessionExamMode === 'ONLINE'
        ? [{ value: 'ONLINE', label: '온라인' }]
        : [{ value: 'OFFLINE', label: '오프라인' }];

  useEffect(() => {
    let active = true;
    const applyPath = `/exam/${sessionId}/apply`;

    const boot = async () => {
      ensureAuthCookieSync();
      if (!getAccessToken()) {
        forceLogoutToLogin(applyPath);
        return;
      }

      const session = await verifyAuthSession();
      if (!active) return;

      if (!session.valid) {
        forceLogoutToLogin(applyPath);
        return;
      }

      setAuthReady(true);
    };

    void boot();
    return () => {
      active = false;
    };
  }, [sessionId]);

  useEffect(() => {
    if (!authReady) return;

    const fetchSession = async () => {
      setSessionLoading(true);
      try {
        const res = await fetchWithAuth(`${API_BASE}/exam/sessions/${sessionId}`, {
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json();
        const fee =
          typeof data.displayFee === 'number'
            ? data.displayFee
            : typeof data.fee === 'number'
              ? data.fee
              : null;
        setSessionInfo({
          qualificationName: data.qualificationName ?? '시험',
          roundName: data.roundName ?? '',
          examMode: data.examMode ?? 'OFFLINE',
          examAt: data.examAt,
          place: data.place,
          applyStartAt: data.applyStartAt,
          applyEndAt: data.applyEndAt,
          fee,
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
        setReferrerGroups(parseReferrerGroups(data?.value));
      } catch {}
    };

    fetchSession();
    fetchReferrerGroups();
  }, [sessionId, authReady]);

  useEffect(() => {
    if (!sessionInfo) return;
    setFormData((prev) => {
      if (prev.examMode) return prev;
      const defaultMode =
        sessionInfo.examMode === 'HYBRID'
          ? 'ONLINE'
          : sessionInfo.examMode === 'ONLINE'
            ? 'ONLINE'
            : 'OFFLINE';
      return { ...prev, examMode: defaultMode };
    });
  }, [sessionInfo]);

  const referrerOptions = flattenReferrerOptions(referrerGroups);
  const selectedMember = findReferrerMemberByCode(referrerGroups, selectedMemberCode);
  const depositAccount = getMemberDepositAccount(selectedMember);

  const handleFormChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleIdPhotoChange = (file: File | null) => {
    if (!file) {
      setIdPhotoFile(null);
      return;
    }

    if (!ALLOWED_ID_PHOTO_TYPES.has(file.type)) {
      toast.error('증명사진은 JPG, PNG, WEBP 파일만 업로드할 수 있습니다.');
      return;
    }

    if (file.size > MAX_ID_PHOTO_BYTES) {
      toast.error('증명사진은 10MB 이하만 업로드할 수 있습니다.');
      return;
    }

    setIdPhotoFile(file);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.examMode || !['ONLINE', 'OFFLINE'].includes(formData.examMode)) {
      toast.error('응시 방식(온라인/오프라인)을 선택해주세요.');
      return;
    }
    if (!idPhotoFile) {
      toast.error('증명사진을 업로드해주세요.');
      return;
    }
    if (!agreedTerms) {
      toast.error('개인정보 수집 및 이용에 동의해주세요.');
      return;
    }
    setStep('payment');
  };

  const handleSubmitApplication = async () => {
    if (!idPhotoFile) {
      toast.error('증명사진을 업로드해주세요.');
      setStep('form');
      return;
    }

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

      const payload = new FormData();
      payload.append('formJson', JSON.stringify(body));
      payload.append('idPhoto', idPhotoFile);

      const res = await fetch(`${API_BASE}/exam/sessions/${sessionId}/apply`, {
        method: 'POST',
        headers: buildAuthHeader(false),
        body: payload,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? '접수에 실패했습니다.');
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
        <p className="text-sm text-muted-foreground">로그인 확인 중...</p>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
        <BrandCard padding="lg" className="max-w-lg w-full text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-brand-blue-subtle"
            
          >
            <CheckCircle2 className="w-8 h-8 text-brand-blue"  />
          </div>
          <h2 className="text-2xl font-extrabold mb-2 text-brand-blue" >
            접수 완료
          </h2>
          <p className="text-muted-foreground mb-5">시험 접수가 완료되었습니다.</p>

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

  const isStepActive = (i: number) =>
    (i === 0 && step === 'form') || (i === 1 && step === 'payment');

  return (
    <div className="min-h-screen bg-hero-gradient py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-8">
          {['접수 정보', '접수 확인'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  isStepActive(i)
                    ? 'text-white bg-brand-orange'
                    : 'text-muted-foreground bg-muted'
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-sm font-medium ${isStepActive(i) ? 'text-foreground' : 'text-muted-foreground'}`}>
                {label}
              </span>
              {i < 1 && <div className="w-8 h-px bg-muted" />}
            </div>
          ))}
        </div>

        <BrandCard padding="lg">
          <h1 className="text-2xl font-extrabold mb-2 text-brand-blue" >
            {step === 'form' ? '시험 접수 신청' : '접수 확인'}
          </h1>
          <p className="text-sm text-muted-foreground mb-4">아래 시험에 대한 접수를 진행합니다.</p>

          <ExamApplySessionSummary session={sessionInfo} loading={sessionLoading} />

          {step === 'form' && (
            <form onSubmit={handleFormSubmit} className="space-y-5">
              {FORM_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="text-sm font-medium text-foreground mb-2.5 block">
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

              <div>
                <label className="text-sm font-medium text-foreground mb-2.5 block">
                  응시 방식 <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                  value={formData.examMode ?? availableExamModes[0]?.value ?? 'OFFLINE'}
                  onChange={(e) => handleFormChange('examMode', e.target.value)}
                  required
                >
                  {availableExamModes.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  회차 설정에 따라 선택 가능한 응시 방식만 노출됩니다.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2.5 block">
                  증명사진 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleIdPhotoChange(e.target.files?.[0] ?? null)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP 파일 / 최대 10MB</p>
                {idPhotoFile && (
                  <p className="text-xs text-foreground mt-1">
                    선택됨: {idPhotoFile.name} ({Math.ceil(idPhotoFile.size / 1024)}KB)
                  </p>
                )}
              </div>

              {referrerOptions.length > 0 && (
                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <label className="text-sm font-medium text-foreground block">
                    신청 계기 <span className="text-muted-foreground font-normal">(선택사항)</span>
                  </label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                    value={selectedMemberCode}
                    onChange={(e) => setSelectedMemberCode(e.target.value)}
                  >
                    <option value="">없음</option>
                    {referrerOptions.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    담당자를 선택하면 해당 계좌로 입금 안내가 표시됩니다.
                  </p>
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
                <label htmlFor="agree" className="text-sm text-muted-foreground cursor-pointer">
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

              <div className="rounded-xl bg-muted/30 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">신청자</span>
                  <span className="font-medium">{formData.applicantName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">이메일</span>
                  <span className="font-medium">{formData.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">응시 방식</span>
                  <span className="font-medium">
                    {formData.examMode === 'ONLINE' ? '온라인' : '오프라인'}
                  </span>
                </div>
                {selectedMemberCode && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">신청 계기</span>
                    <span className="font-medium">
                      {referrerOptions.find((option) => option.code === selectedMemberCode)?.label
                        ?? selectedMember?.label
                        ?? selectedMemberCode}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">증명사진</span>
                  <span className="font-medium">{idPhotoFile?.name ?? '-'}</span>
                </div>
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
