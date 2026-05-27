import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { CoursesListClient } from '@/components/courses/CoursesListClient';
import { PublicAuthRefresh } from '@/components/auth/PublicAuthRefresh';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '교육과정',
  description: 'AI 자격 취득을 위한 교육과정 목록입니다.',
};

export default function CoursesPage() {
  return (
    <>
      <PublicAuthRefresh />
      <div>
        <section className="bg-hero-gradient py-14 border-b">
          <div className="max-w-5xl mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3 text-brand-blue">교육과정</h1>
            <p className="text-muted-foreground">AI 자격 취득을 위한 체계적인 교육과정을 만나보세요.</p>
            <div className="mt-4">
              <Link href="/courses/harness-program">
                <BrandButton variant="outline" size="sm">
                  Harness 기업 교육 프로그램 보기
                  <ArrowRight className="w-4 h-4 ml-1" />
                </BrandButton>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <CoursesListClient />
          </div>
        </section>
      </div>
    </>
  );
}
