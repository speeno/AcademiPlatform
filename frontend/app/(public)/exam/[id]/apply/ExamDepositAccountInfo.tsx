'use client';

import { Landmark } from 'lucide-react';
import {
  DEFAULT_EXAM_DEPOSIT_ACCOUNT,
  type DepositAccountInfo,
} from '@/lib/referrer';

interface ExamDepositAccountInfoProps {
  account?: DepositAccountInfo;
}

export function ExamDepositAccountInfo({ account = DEFAULT_EXAM_DEPOSIT_ACCOUNT }: ExamDepositAccountInfoProps) {
  const title = account.sourceLabel
    ? `${account.sourceLabel} 담당 입금 계좌`
    : '입금 계좌번호';

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3 mb-6">
      <div className="flex items-center gap-2">
        <Landmark className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--brand-orange)' }} />
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      </div>
      <p className="text-xs text-gray-600">
        카드 결제는 현재 지원되지 않습니다. 아래 계좌로 접수비를 입금해 주세요.
      </p>
      <dl className="text-sm space-y-1.5">
        <div className="flex gap-2">
          <dt className="text-gray-500 shrink-0 w-20">입금은행</dt>
          <dd className="font-medium text-gray-900">{account.bank}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-gray-500 shrink-0 w-20">입금계좌</dt>
          <dd className="font-semibold text-gray-900 tracking-wide">{account.account}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-gray-500 shrink-0 w-20">예금주</dt>
          <dd className="font-medium text-gray-900">{account.holder}</dd>
        </div>
      </dl>
      <p className="text-xs text-gray-500">
        입금자명은 신청자 성명과 동일하게 기재해 주세요. 학습 교재 안내는 등록 이메일로 전달됩니다.
      </p>
    </div>
  );
}
