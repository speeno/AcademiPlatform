import type { Metadata } from 'next';
import { PublicScheduleWidget } from '@/components/training/PublicScheduleWidget';

export const metadata: Metadata = {
  title: '교육 일정 | 한국디지털문서플랫폼협회',
  description: '한국디지털문서플랫폼협회 교육 일정 안내 — 진행·예정 중인 교육을 확인하세요.',
  robots: { index: false },
};

/**
 * 게시용 교육 일정 독립 페이지 (랜딩형).
 * 헤더/푸터는 app/schedule/layout.tsx 공통 레이아웃이 담당한다.
 * 과정 클릭 시 같은 격리 영역의 확대 보기(/schedule/plan/[token])로 이동한다.
 */
export default function SchedulePage() {
  return <PublicScheduleWidget hideWhenEmpty={false} planHrefBase="/schedule/plan" />;
}
