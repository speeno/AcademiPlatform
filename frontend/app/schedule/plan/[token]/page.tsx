import type { Metadata } from 'next';
import { SharedPlanView } from '@/components/training/SharedPlanView';

export const metadata: Metadata = {
  title: '강의 계획 | 한국디지털문서플랫폼협회',
  robots: { index: false },
};

/**
 * 게시용 확대 달력(과정 상세) — /schedule 미니 달력에서 이동해 오고,
 * 돌아가기 링크로 다시 /schedule 로 복귀하는 격리된 흐름.
 */
export default async function SchedulePlanPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <SharedPlanView token={token} backHref="/schedule" backLabel="교육 일정 전체 보기" />;
}
