'use client';

import { useEffect, useState } from 'react';
import { BadgeCheck, BadgeX, Search } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandCard } from '@/components/ui/brand-card';
import { apiFetch, parseJsonSafe } from '@/lib/api-client';
import { formatKoreanDate } from '@/lib/calendar';

interface VerifyResult {
  valid: boolean;
  certificateNo?: string;
  participantName?: string;
  programTitle?: string;
  periodStart?: string;
  periodEnd?: string;
  issuedAt?: string;
}

/** 수료증 진위확인 — 공개 페이지 (로그인 불필요) */
export default function CertificateVerifyPage() {
  const [certificateNo, setCertificateNo] = useState('');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const verify = async (no: string) => {
    const trimmed = no.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(false);
    setResult(null);
    try {
      const res = await apiFetch(
        `/training/certificates/verify/${encodeURIComponent(trimmed)}`,
      );
      if (!res.ok) {
        setError(true);
        return;
      }
      setResult(await parseJsonSafe<VerifyResult>(res, { valid: false }));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // 수료증 인쇄물의 QR/URL 딥링크(?no=) 지원
  useEffect(() => {
    const no = new URLSearchParams(window.location.search).get('no');
    if (no) {
      setCertificateNo(no);
      void verify(no);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void verify(certificateNo);
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <BrandCard padding="lg">
        <div className="mb-6 text-center">
          <h1 className="text-heading text-brand-blue">수료증 진위확인</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            수료증에 기재된 발급 번호를 입력하면 진위 여부를 확인할 수 있습니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={certificateNo}
            onChange={(e) => setCertificateNo(e.target.value)}
            placeholder="예: AQ-EDU-2026-0001"
            className="w-full rounded-lg border border-border px-3 py-2 font-mono text-sm"
            required
          />
          <BrandButton type="submit" variant="primary" loading={loading}>
            <Search className="h-4 w-4" /> 확인
          </BrandButton>
        </form>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
          </p>
        )}

        {result && !result.valid && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-center">
            <BadgeX className="mx-auto mb-2 h-10 w-10 text-red-500" />
            <p className="font-semibold text-red-700">유효하지 않은 수료증 번호입니다.</p>
            <p className="mt-1 text-xs text-red-600">
              번호를 다시 확인하거나 발급 기관에 문의해주세요. 폐기(재발급)된 수료증도 유효하지
              않은 것으로 표시됩니다.
            </p>
          </div>
        )}

        {result?.valid && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="mb-4 text-center">
              <BadgeCheck className="mx-auto mb-2 h-10 w-10 text-emerald-500" />
              <p className="font-semibold text-emerald-700">정상 발급된 수료증입니다.</p>
            </div>
            <dl className="space-y-2 text-sm">
              {[
                ['발급 번호', result.certificateNo],
                ['수료자', result.participantName],
                ['과정명', result.programTitle],
                [
                  '교육 기간',
                  result.periodStart && result.periodEnd
                    ? `${formatKoreanDate(result.periodStart)} ~ ${formatKoreanDate(result.periodEnd)}`
                    : undefined,
                ],
                [
                  '발급일',
                  result.issuedAt ? formatKoreanDate(result.issuedAt.slice(0, 10)) : undefined,
                ],
              ]
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div key={label as string} className="flex justify-between gap-4">
                    <dt className="shrink-0 text-muted-foreground">{label}</dt>
                    <dd className="text-right font-medium text-foreground">{value}</dd>
                  </div>
                ))}
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">
              개인정보 보호를 위해 수료자 이름은 일부 가려서 표시됩니다.
            </p>
          </div>
        )}
      </BrandCard>
    </div>
  );
}
