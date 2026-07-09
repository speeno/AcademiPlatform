'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Clock, MapPin } from 'lucide-react';
import { PageLoader } from '@/components/ui/page-loader';
import { MonthCalendar } from '@/components/training/MonthCalendar';
import { ProgramStatusBadge } from '@/components/training/ProgramStatusBadge';
import { apiFetch, parseJsonSafe } from '@/lib/api-client';
import { currentMonth, formatKoreanDate, formatKoreanDateWithDay } from '@/lib/calendar';
import type { CalendarSessionEvent, PublicTrainingPlan } from '@/lib/training-types';

interface SharedPlanViewProps {
  token: string;
  /** 지정 시 상단에 돌아가기 링크 표시 (격리된 게시용 페이지에서 사용) */
  backHref?: string;
  backLabel?: string;
}

/** 게시용 강의 계획 보기 전용 뷰 — 확대 달력 + 회차 목록 (로그인 불필요) */
export function SharedPlanView({ token, backHref, backLabel }: SharedPlanViewProps) {
  const [plan, setPlan] = useState<PublicTrainingPlan | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [month, setMonth] = useState(currentMonth());

  useEffect(() => {
    (async () => {
      const res = await apiFetch(`/training/plans/${encodeURIComponent(token)}`);
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const data = await parseJsonSafe<PublicTrainingPlan | null>(res, null);
      if (!data) {
        setNotFound(true);
        return;
      }
      setPlan(data);
      // 교육 기간이 현재와 다르면 시작월을 먼저 보여준다
      const nowMonth = currentMonth();
      if (data.startDate.slice(0, 7) > nowMonth || data.endDate.slice(0, 7) < nowMonth) {
        setMonth(data.startDate.slice(0, 7));
      }
    })();
  }, [token]);

  const events: CalendarSessionEvent[] = useMemo(
    () =>
      (plan?.sessions ?? []).map((s) => ({
        id: s.id,
        programId: plan!.id,
        programTitle: plan!.title,
        programStatus: plan!.status,
        sessionNo: s.sessionNo,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        topic: s.topic,
        location: s.location,
      })),
    [plan],
  );

  const backLink = backHref && (
    <Link
      href={backHref}
      className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" /> {backLabel ?? '교육 일정 전체 보기'}
    </Link>
  );

  if (notFound) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        {backLink}
        <h1 className="text-heading text-brand-blue">강의 계획을 찾을 수 없습니다</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          링크가 잘못되었거나 공유가 해제된 강의 계획입니다.
        </p>
      </div>
    );
  }

  if (!plan) return <PageLoader />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {backLink}

      {/* 과정 정보 */}
      <div className="mb-6 border-b border-border pb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-orange">
          교육 일정 안내
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-heading text-brand-blue">{plan.title}</h1>
          <ProgramStatusBadge status={plan.status} />
        </div>
        {plan.description && (
          <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
            {plan.description}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {formatKoreanDate(plan.startDate)} ~ {formatKoreanDate(plan.endDate)} (총{' '}
            {plan.sessions.length}회)
          </span>
          {plan.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {plan.location}
            </span>
          )}
        </div>
      </div>

      {/* 보기 전용 확대 달력 (드래그/클릭 편집 없음) */}
      <MonthCalendar month={month} onMonthChange={setMonth} events={events} />

      {/* 회차 목록 */}
      <div className="mt-8">
        <h2 className="mb-3 text-base font-semibold text-foreground">회차 일정</h2>
        {plan.sessions.length === 0 ? (
          <p className="rounded-xl border border-border bg-card py-10 text-center text-sm text-muted-foreground">
            등록된 회차가 아직 없습니다.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {plan.sessions.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-border bg-card px-4 py-3 text-sm"
              >
                <span className="w-14 shrink-0 font-semibold text-brand-blue">
                  {s.sessionNo}회차
                </span>
                <span className="font-medium text-foreground">
                  {formatKoreanDateWithDay(s.date)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {s.startTime}–{s.endTime}
                </span>
                {s.topic && <span className="text-muted-foreground">{s.topic}</span>}
                {s.location && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {s.location}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        본 페이지는 게시용 보기 전용 일정 안내입니다.
      </p>
    </div>
  );
}
