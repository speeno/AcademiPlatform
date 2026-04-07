import Link from 'next/link';
import Image from 'next/image';
import { Clock, Users, BookOpen, ArrowRight } from 'lucide-react';
import { BrandCard, BrandCardTitle } from '@/components/ui/brand-card';
import { BrandBadge } from '@/components/ui/brand-badge';
import { BrandButton } from '@/components/ui/brand-button';
import { PriceDisplay } from '@/components/ui/price-display';
import type { Metadata } from 'next';
import { API_BASE } from '@/lib/api-base';

export const metadata: Metadata = {
  title: '교육과정',
  description: 'AI 자격 취득을 위한 교육과정 목록입니다.',
};

async function getCourses() {
  try {
    const res = await fetch(`${API_BASE}/courses?limit=12`, { next: { revalidate: 60 } });
    if (!res.ok) return { courses: [], total: 0 };
    return res.json();
  } catch {
    return { courses: [], total: 0 };
  }
}

export default async function CoursesPage() {
  const { courses } = await getCourses();

  return (
    <div>
      {/* 헤더 */}
      <section className="bg-hero-gradient py-14 border-b">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3" style={{ color: 'var(--brand-blue)' }}>
            교육과정
          </h1>
          <p className="text-gray-600">AI 자격 취득을 위한 체계적인 교육과정을 만나보세요.</p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          {/* 과정 목록 */}
          {courses.length === 0 ? (
            <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
              현재 공개된 교육과정이 없습니다.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course: any) => (
              <Link key={course.id} href={`/courses/${course.slug ?? course.id}`}>
                <BrandCard hoverable accent="blue" padding="none" className="overflow-hidden h-full flex flex-col">
                  {/* 썸네일 */}
                  <div className="h-48 overflow-hidden bg-gray-100 flex-shrink-0">
                    {course.thumbnailUrl ? (
                      <Image
                        src={course.thumbnailUrl}
                        alt={course.title}
                        width={400}
                        height={192}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="h-full flex items-center justify-center"
                        style={{ background: 'var(--gradient-logo)' }}
                      >
                        <BookOpen className="w-10 h-10 text-white opacity-60" />
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    {course.category && (
                      <BrandBadge variant="blue" className="mb-2 self-start">{course.category}</BrandBadge>
                    )}
                    <BrandCardTitle className="mb-2 line-clamp-2">{course.title}</BrandCardTitle>
                    <p className="text-xs text-gray-400 mb-3">강사: {course.instructor?.name ?? '-'}</p>

                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                      {course.learningPeriodDays && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {course.learningPeriodDays}일
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {course._count?.enrollments ?? 0}명 수강 중
                      </span>
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                      <PriceDisplay
                        price={course.price ?? 0}
                        className="text-lg font-extrabold"
                        style={{ color: 'var(--brand-orange)' }}
                      />
                      <span className="text-xs font-medium" style={{ color: 'var(--brand-blue)' }}>
                        상세 보기 →
                      </span>
                    </div>
                  </div>
                </BrandCard>
              </Link>
            ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
