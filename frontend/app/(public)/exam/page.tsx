import { PublicAuthRefresh } from '@/components/auth/PublicAuthRefresh';
import { PageShell } from '@/components/layout/PageShell';
import { ExamSessionsClient } from '@/components/exam/ExamSessionsClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '시험 접수',
  description: 'AI 자격 시험 일정을 확인하고 온라인으로 접수하세요.',
};

export default function ExamPage() {
  return (
    <>
      <PublicAuthRefresh />
      <section className="bg-hero-gradient py-14 border-b">
        <PageShell flush>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3 text-brand-blue">시험 접수</h1>
          <p className="text-muted-foreground">AI 자격 시험 일정을 확인하고 온라인으로 접수하세요.</p>
        </PageShell>
      </section>

      <ExamSessionsClient />
    </>
  );
}
