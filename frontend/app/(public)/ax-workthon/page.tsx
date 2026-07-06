import type { Metadata } from 'next';
import { AxWorkthonContent } from '@/components/promo/AxWorkthonContent';

export const metadata: Metadata = {
  title: 'AX 워크톤(Work-a-thon) — 일로 증명하는 AI 실전 프로그램',
  description:
    'AX 워크톤은 AI 도구 사용법 교육이 아니라, 조직이 AI 자동화를 안전하게 반복하기 위한 업무 표준화와 개발 하네스 구축 교육입니다. 데이(1일)·스프린트(3일)·부트캠프(1주), 비개발자·개발자 트랙, ISO 국제표준 기반 AI 자격 연계.',
};

export default function AxWorkthonPage() {
  return <AxWorkthonContent />;
}
