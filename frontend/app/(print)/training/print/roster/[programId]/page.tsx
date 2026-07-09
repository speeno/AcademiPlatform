'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PrintToolbar } from '@/components/training/print/PrintToolbar';
import { apiFetchWithAuth, parseJsonSafe } from '@/lib/api-client';
import { formatKoreanDate, todayYmd } from '@/lib/calendar';
import {
  PARTICIPANT_STATUS_LABELS,
  type TrainingParticipant,
  type TrainingProgram,
} from '@/lib/training-types';

const cellClass = 'border border-gray-400 px-2 py-1.5 text-left align-middle';

/** 수강생 명단 인쇄 */
export default function RosterPrintPage() {
  const params = useParams<{ programId: string }>();
  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [participants, setParticipants] = useState<TrainingParticipant[]>([]);

  useEffect(() => {
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

  if (!program) {
    return <p className="p-8 text-sm text-gray-500">불러오는 중…</p>;
  }

  return (
    <div className="print-sheet mx-auto max-w-3xl p-6 text-sm print:max-w-none print:p-0">
      <PrintToolbar title="수강생 명단 인쇄 미리보기" />

      <h1 className="mb-4 text-center text-2xl font-bold">수강생 명단</h1>

      {/* 과정 정보 */}
      <table className="mb-5 w-full border-collapse text-sm">
        <tbody>
          <tr>
            <th className={`${cellClass} w-24 bg-gray-100`}>과정명</th>
            <td className={cellClass} colSpan={3}>
              {program.title}
            </td>
          </tr>
          <tr>
            <th className={`${cellClass} bg-gray-100`}>교육 기간</th>
            <td className={cellClass}>
              {formatKoreanDate(program.startDate)} ~ {formatKoreanDate(program.endDate)}
            </td>
            <th className={`${cellClass} w-24 bg-gray-100`}>장소</th>
            <td className={cellClass}>{program.location ?? '—'}</td>
          </tr>
          <tr>
            <th className={`${cellClass} bg-gray-100`}>수강 인원</th>
            <td className={cellClass}>
              {participants.length}명{program.capacity ? ` / 정원 ${program.capacity}명` : ''}
            </td>
            <th className={`${cellClass} bg-gray-100`}>출력일</th>
            <td className={cellClass}>{formatKoreanDate(todayYmd())}</td>
          </tr>
        </tbody>
      </table>

      {/* 명단 */}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className={`${cellClass} w-12 text-center`}>번호</th>
            <th className={cellClass}>이름</th>
            <th className={`${cellClass} w-16 text-center`}>구분</th>
            <th className={cellClass}>소속</th>
            <th className={cellClass}>연락처</th>
            <th className={cellClass}>이메일</th>
            <th className={`${cellClass} w-16 text-center`}>상태</th>
            <th className={`${cellClass} w-20`}>비고</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((p, i) => (
            <tr key={p.id}>
              <td className={`${cellClass} text-center`}>{i + 1}</td>
              <td className={cellClass}>{p.name}</td>
              <td className={`${cellClass} text-center`}>
                {p.type === 'MEMBER' ? '회원' : '비회원'}
              </td>
              <td className={cellClass}>{p.affiliation ?? ''}</td>
              <td className={cellClass}>{p.phone ?? ''}</td>
              <td className={cellClass}>{p.email ?? ''}</td>
              <td className={`${cellClass} text-center`}>
                {PARTICIPANT_STATUS_LABELS[p.status]}
              </td>
              <td className={cellClass}></td>
            </tr>
          ))}
          {participants.length === 0 && (
            <tr>
              <td className={`${cellClass} py-8 text-center text-gray-500`} colSpan={8}>
                등록된 수강생이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
