'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { PrintToolbar } from '@/components/training/print/PrintToolbar';
import { apiFetchWithAuth, parseJsonSafe } from '@/lib/api-client';
import { formatKoreanDate } from '@/lib/calendar';
import type { TrainingParticipant, TrainingProgram } from '@/lib/training-types';

const cellClass = 'border border-gray-400 px-2 py-1.5 align-middle';

/**
 * 출석부 인쇄.
 * - 기본: 행=수강생, 열=회차별 서명란
 * - ?sessionId= 지정 시: 해당 회차 단일 출석부(서명란 크게)
 */
export default function AttendanceSheetPrintPage() {
  const params = useParams<{ programId: string }>();
  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [participants, setParticipants] = useState<TrainingParticipant[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    setSessionId(new URLSearchParams(window.location.search).get('sessionId'));
    (async () => {
      const [programRes, participantsRes] = await Promise.all([
        apiFetchWithAuth(`/training/programs/${params.programId}`),
        apiFetchWithAuth(`/training/programs/${params.programId}/participants`),
      ]);
      if (programRes.ok) setProgram(await programRes.json());
      if (participantsRes.ok) {
        const data = await parseJsonSafe<{ participants: TrainingParticipant[] }>(
          participantsRes,
          { participants: [] },
        );
        setParticipants(data.participants);
      }
    })();
  }, [params.programId]);

  const sessions = useMemo(() => program?.sessions ?? [], [program]);
  const singleSession = useMemo(
    () => (sessionId ? sessions.find((s) => s.id === sessionId) ?? null : null),
    [sessions, sessionId],
  );

  if (!program) {
    return <p className="p-8 text-sm text-gray-500">불러오는 중…</p>;
  }

  return (
    <div className="print-sheet mx-auto max-w-4xl p-6 text-sm print:max-w-none print:p-0">
      <PrintToolbar title="출석부 인쇄 미리보기" />

      <h1 className="mb-4 text-center text-2xl font-bold">
        출석부{singleSession ? ` (${singleSession.sessionNo}회차)` : ''}
      </h1>

      {/* 과정 정보 */}
      <table className="mb-5 w-full border-collapse text-sm">
        <tbody>
          <tr>
            <th className={`${cellClass} w-24 bg-gray-100 text-left`}>과정명</th>
            <td className={cellClass} colSpan={3}>
              {program.title}
            </td>
          </tr>
          <tr>
            <th className={`${cellClass} bg-gray-100 text-left`}>교육 기간</th>
            <td className={cellClass}>
              {formatKoreanDate(program.startDate)} ~ {formatKoreanDate(program.endDate)}
            </td>
            <th className={`${cellClass} w-24 bg-gray-100 text-left`}>장소</th>
            <td className={cellClass}>{program.location ?? '—'}</td>
          </tr>
          {singleSession && (
            <tr>
              <th className={`${cellClass} bg-gray-100 text-left`}>수업 일시</th>
              <td className={cellClass} colSpan={3}>
                {formatKoreanDate(singleSession.date)} {singleSession.startTime}~
                {singleSession.endTime}
                {singleSession.topic ? ` · ${singleSession.topic}` : ''}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {singleSession ? (
        /* 단일 회차 모드 */
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className={`${cellClass} w-12 text-center`}>번호</th>
              <th className={`${cellClass} text-left`}>이름</th>
              <th className={`${cellClass} text-left`}>소속</th>
              <th className={`${cellClass} text-left`}>연락처</th>
              <th className={`${cellClass} w-32 text-center`}>서명</th>
              <th className={`${cellClass} w-24 text-center`}>비고</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p, i) => (
              <tr key={p.id}>
                <td className={`${cellClass} text-center`}>{i + 1}</td>
                <td className={cellClass}>{p.name}</td>
                <td className={cellClass}>{p.affiliation ?? ''}</td>
                <td className={cellClass}>{p.phone ?? ''}</td>
                <td className={`${cellClass} h-10`}></td>
                <td className={cellClass}></td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        /* 전체 회차 모드 — 회차별 서명 컬럼 */
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className={`${cellClass} w-10 text-center`}>번호</th>
              <th className={`${cellClass} text-left`}>이름</th>
              <th className={`${cellClass} text-left`}>소속</th>
              {sessions.map((s) => (
                <th key={s.id} className={`${cellClass} text-center`}>
                  {s.sessionNo}회차
                  <br />
                  <span className="font-normal text-gray-500">
                    {s.date.slice(5).replace('-', '/')}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {participants.map((p, i) => (
              <tr key={p.id}>
                <td className={`${cellClass} text-center`}>{i + 1}</td>
                <td className={cellClass}>{p.name}</td>
                <td className={cellClass}>{p.affiliation ?? ''}</td>
                {sessions.map((s) => (
                  <td key={s.id} className={`${cellClass} h-9 min-w-14`}></td>
                ))}
              </tr>
            ))}
            {participants.length === 0 && (
              <tr>
                <td
                  className={`${cellClass} py-8 text-center text-gray-500`}
                  colSpan={3 + sessions.length}
                >
                  등록된 수강생이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
