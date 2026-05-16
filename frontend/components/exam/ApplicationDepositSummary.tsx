'use client';

import type { DepositAccountInfo } from '@/lib/referrer';

interface ApplicationDepositSummaryProps {
  account: DepositAccountInfo;
}

export function ApplicationDepositSummary({ account }: ApplicationDepositSummaryProps) {
  return (
    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1.5">
      <p className="text-xs font-semibold text-gray-800">
        {account.sourceLabel ? `${account.sourceLabel} 담당 입금 계좌` : '입금 계좌'}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
        <span>입금은행: <span className="font-medium text-gray-900">{account.bank}</span></span>
        <span>예금주: <span className="font-medium text-gray-900">{account.holder}</span></span>
        <span className="sm:col-span-2">
          입금계좌: <span className="font-semibold text-gray-900 tracking-wide">{account.account}</span>
        </span>
      </div>
    </div>
  );
}
