'use client';

import { Printer, X } from 'lucide-react';

/** 인쇄 페이지 상단 툴바 — 인쇄 시에는 숨겨진다 */
export function PrintToolbar({ title }: { title: string }) {
  return (
    <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4 print:hidden">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          <Printer className="h-4 w-4" /> 인쇄
        </button>
        <button
          type="button"
          onClick={() => window.close()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <X className="h-4 w-4" /> 닫기
        </button>
      </div>
    </div>
  );
}
