import Link from 'next/link';
import { ArrowRight, Info } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { BrandCard } from '@/components/ui/brand-card';
import { CoursesListClient } from '@/components/courses/CoursesListClient';
import { PublicAuthRefresh } from '@/components/auth/PublicAuthRefresh';
import { PageShell } from '@/components/layout/PageShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '자격증교육과정',
  description: 'ISO/IEC 17024 기반 AI 국제자격증 교육과정 목록입니다.',
};

export default function CoursesPage() {
  return (
    <>
      <PublicAuthRefresh />
      <div>
        <section className="bg-hero-gradient py-14 border-b">
          <PageShell size="content" flush>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3 text-brand-blue">자격증교육과정</h1>
            <p className="text-muted-foreground">
              ISO/IEC 17024 기반 AI 국제자격증 취득을 위한 체계적인 교육과정을 만나보세요.
            </p>
          </PageShell>
        </section>

        <section className="py-12 bg-white">
          <PageShell size="content" flush>
            <h2 className="text-xl font-bold text-foreground mb-2">ISO/IEC 17024 자격증 교육과정</h2>
            <p className="text-sm text-muted-foreground mb-6">
              국제 표준 기반 자격증 취득을 목표로 하는 공식 교육 과정입니다.
            </p>
            <CoursesListClient
              excludeHarness
              emptyMessage="현재 공개된 자격증 교육과정이 없습니다."
            />
          </PageShell>
        </section>

        <section className="py-12 bg-muted/30 border-t">
          <PageShell size="content" flush>
            <h2 className="text-xl font-bold text-foreground mb-2">Harness 기업 교육 프로그램</h2>
            <p className="text-sm text-muted-foreground mb-4">
              기업 AX 전환·실무 자동화를 위한 별도 교육 프로그램입니다. 자격증 교육과정과는 구분됩니다.
            </p>

            <div className="flex items-start gap-2 rounded-lg border border-brand-orange/30 bg-brand-orange-subtle/50 px-4 py-3 mb-6 text-sm text-foreground">
              <Info className="w-4 h-4 mt-0.5 shrink-0 text-brand-orange" />
              <p>
                <span className="font-semibold">안내:</span> 하네스 과정은 ISO/IEC 17024 인공지능 교육과정에
                포함되지 않습니다.
              </p>
            </div>

            <BrandCard padding="lg" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-bold text-foreground">Harness · Agent Skills 프로그램</p>
                <p className="text-sm text-muted-foreground mt-1">
                  오프라인·온라인 실시간 워크숍 중심의 기업 맞춤 교육입니다.
                </p>
              </div>
              <Link href="/courses/harness-program" className="shrink-0">
                <BrandButton variant="outline" size="sm">
                  Harness 프로그램 보기
                  <ArrowRight className="w-4 h-4 ml-1" />
                </BrandButton>
              </Link>
            </BrandCard>
          </PageShell>
        </section>
      </div>
    </>
  );
}
