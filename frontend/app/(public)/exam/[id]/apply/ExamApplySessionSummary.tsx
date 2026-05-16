'use client';

import { Calendar, MapPin } from 'lucide-react';
import { BrandBadge } from '@/components/ui/brand-badge';
import { PriceDisplay } from '@/components/ui/price-display';

export interface ExamSessionSummaryData {
  qualificationName: string;
  roundName: string;
  examAt: string;
  place?: string | null;
  applyStartAt: string;
  applyEndAt: string;
  fee: number;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface ExamApplySessionSummaryProps {
  session: ExamSessionSummaryData | null;
  loading?: boolean;
}

export function ExamApplySessionSummary({ session, loading }: ExamApplySessionSummaryProps) {
  if (loading) {
    return (
      <div className="rounded-xl border bg-gray-50 p-4 mb-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 mb-6 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold text-gray-900">{session.qualificationName}</h2>
        <BrandBadge variant="blue">{session.roundName}</BrandBadge>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--brand-blue)' }} />
          시험일 {formatDate(session.examAt)}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--brand-blue)' }} />
          {session.place ?? '장소 미정'}
        </span>
      </div>

      <p className="text-xs text-gray-500">
        접수 기간: {formatDate(session.applyStartAt)} ~ {formatDate(session.applyEndAt)}
      </p>

      <div className="flex items-center justify-between pt-2 border-t border-blue-100">
        <span className="text-sm font-medium text-gray-700">접수비</span>
        <PriceDisplay
          price={session.fee}
          className="text-xl font-extrabold"
          style={{ color: 'var(--brand-orange)' }}
        />
      </div>
    </div>
  );
}
