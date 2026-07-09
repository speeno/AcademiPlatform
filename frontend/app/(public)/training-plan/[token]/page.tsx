'use client';

import { useParams } from 'next/navigation';
import { SharedPlanView } from '@/components/training/SharedPlanView';

/** 게시용 강의 계획 보기 전용 페이지 — 사이트 공개 레이아웃(네비게이션 포함) 버전 */
export default function SharedTrainingPlanPage() {
  const params = useParams<{ token: string }>();
  return <SharedPlanView token={params.token} />;
}
