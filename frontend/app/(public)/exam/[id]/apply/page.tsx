'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandCard } from '@/components/ui/brand-card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { buildAuthHeader } from '@/lib/auth';

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
  const [fee, setFee] = useState(0);
  const [sessionName, setSessionName] = useState('시험 접수');

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exam/sessions/${sessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        setFee(Number(data.fee) || 0);
        setSessionName(`${data.qualificationName ?? '시험'} ${data.roundName ?? ''}`.trim());
      } catch {
        // ignore
      }
    };
    fetchSession();
  }, [sessionId]);

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exam/sessions/${sessionId}/apply`, {
        method: 'POST',
        headers: buildAuthHeader(),
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? '접수에 실패했습니다.');
      toast.success('시험 접수가 완료되었습니다.');
      setStep('complete');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

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

          <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 mb-6 text-left space-y-2">
            <p className="text-sm text-blue-800">
              📧 접수비 입금 계좌 안내 및 학습 교재는 등록하신 이메일로 전달될 예정입니다.
            </p>
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
        {/* 진행 단계 표시 */}
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
          <h1 className="text-2xl font-extrabold mb-6" style={{ color: 'var(--brand-blue)' }}>
            {step === 'form' ? '시험 접수 신청' : '접수 확인'}
          </h1>

          {step === 'form' && (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {FORM_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
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
              <div className="rounded-xl bg-gray-50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">신청자</span>
                  <span className="font-medium">{formData.applicantName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">이메일</span>
                  <span className="font-medium">{formData.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">응시료</span>
                  <span className="font-bold text-base" style={{ color: 'var(--brand-orange)' }}>
                    {fee.toLocaleString()}원
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                <p className="text-sm text-blue-800">
                  📧 접수비 입금 계좌 안내 및 학습 교재는 등록하신 이메일로 전달될 예정입니다.
                </p>
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
