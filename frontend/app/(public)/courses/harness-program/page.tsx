import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, BookOpen, Briefcase, Users } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandCard } from '@/components/ui/brand-card';
import { PageShell } from '@/components/layout/PageShell';

export const metadata: Metadata = {
  title: 'Harness 기업 교육 프로그램',
  description: '오프라인·온라인 실시간 워크숍 중심의 Harness/Agent Skills 기업 교육 프로그램 소개',
};

const TRACKS = [
  { title: '비개발자 트랙', desc: '업무 시나리오 기반 자동화 설계와 운영 표준 수립' },
  { title: '개발자 트랙', desc: 'Skill 패키지·Task 분해·검증 파이프라인 구축' },
];

export default function HarnessProgramPage() {
  return (
    <div>
      <section className="border-b bg-hero-gradient py-14">
        <PageShell size="content" flush>
          <p className="text-sm font-semibold text-brand-orange mb-2">기업 맞춤 교육</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-brand-blue">
            Harness · Agent Skills 프로그램
          </h1>
          <p className="mt-3 text-muted-foreground">
            실시간 워크숍(오프라인/온라인)을 주력으로 진행하고, AcademiQ는 자료 열람·과제 제출 허브로 보조 사용합니다.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/courses">
              <BrandButton variant="outline" size="sm">강좌 목록으로</BrandButton>
            </Link>
            <Link href="/contact">
              <BrandButton variant="ghost" size="sm">교육 문의</BrandButton>
            </Link>
          </div>
        </PageShell>
      </section>

      <section className="py-10">
        <PageShell size="content" flush className="grid gap-4 md:grid-cols-2">
          {TRACKS.map((track) => (
            <BrandCard key={track.title} accent="blue" padding="md">
              <p className="text-lg font-bold text-foreground">{track.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{track.desc}</p>
            </BrandCard>
          ))}
        </PageShell>
      </section>

      <section className="pb-12">
        <PageShell size="content" flush>
          <div className="rounded-xl border bg-white p-6">
          <h2 className="text-xl font-bold text-foreground">구성</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border p-4 text-sm">
              <BookOpen className="mb-2 h-4 w-4 text-brand-blue" />
              1일 / 3일 / 1주 과정
            </div>
            <div className="rounded-lg border p-4 text-sm">
              <Users className="mb-2 h-4 w-4 text-brand-blue" />
              코호트 기반 실시간 진행
            </div>
            <div className="rounded-lg border p-4 text-sm">
              <Briefcase className="mb-2 h-4 w-4 text-brand-blue" />
              산업별 Harness Lab 연계
            </div>
          </div>
          <Link href="/courses" className="mt-5 inline-flex items-center text-sm font-semibold text-brand-blue">
            AcademiQ 과정 확인 <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
          </div>
        </PageShell>
      </section>
    </div>
  );
}
