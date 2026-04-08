import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Clock, Users, BookOpen, PlayCircle, FileText, ChevronDown, Award, Video } from 'lucide-react';
import { BrandBadge } from '@/components/ui/brand-badge';
import { PriceDisplay } from '@/components/ui/price-display';
import EnrollButton from './EnrollButton';
import { API_BASE } from '@/lib/api-base';
import { MainShortsSection } from '@/components/shorts/MainShortsSection';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4400/api';

async function getCourse(slug: string) {
  try {
    const res = await fetch(`${API}/courses/${slug}`, { next: { revalidate: 60 } });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) return { title: '강좌를 찾을 수 없습니다' };
  return {
    title: course.title,
    description: course.summary ?? course.description ?? `${course.title} 강좌 상세 페이지`,
  };
}

const lessonTypeIcon: Record<string, React.ReactNode> = {
  VIDEO_YOUTUBE: <PlayCircle className="w-4 h-4 text-red-400" />,
  VIDEO_UPLOAD:  <PlayCircle className="w-4 h-4" style={{ color: 'var(--brand-blue)' }} />,
  DOCUMENT:      <FileText className="w-4 h-4 text-amber-500" />,
  TEXT:          <FileText className="w-4 h-4 text-gray-400" />,
  LIVE_LINK:     <PlayCircle className="w-4 h-4 text-green-500" />,
  QUIZ:          <Award className="w-4 h-4 text-purple-400" />,
};

const lessonTypeLabel: Record<string, string> = {
  VIDEO_YOUTUBE: 'YouTube',
  VIDEO_UPLOAD:  '동영상',
  DOCUMENT:      '문서',
  TEXT:          '텍스트',
  LIVE_LINK:     '라이브',
  QUIZ:          '퀴즈',
};

async function getShortsForCourse() {
  try {
    const [galleryRes, displayRes] = await Promise.all([
      fetch(`${API_BASE}/settings/public/shorts_gallery`, { next: { revalidate: 30 } }),
      fetch(`${API_BASE}/settings/public/shorts_display`, { next: { revalidate: 30 } }),
    ]);
    let items: any[] = [];
    let show = true;
    if (galleryRes.ok) {
      const g = await galleryRes.json().catch(() => ({}));
      items = Array.isArray(g?.value) ? g.value.filter((v: any) => v?.isActive !== false) : [];
    }
    if (displayRes.ok) {
      const d = await displayRes.json().catch(() => ({}));
      try {
        const parsed = JSON.parse(d?.value ?? '{}');
        show = parsed.showOnCourseDetail !== false;
      } catch {}
    }
    return { items, show };
  } catch {
    return { items: [], show: true };
  }
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [course, shortsData] = await Promise.all([getCourse(slug), getShortsForCourse()]);

  if (!course) notFound();

  const totalLessons = (course.modules ?? []).reduce(
    (acc: number, m: any) => acc + (m.lessons?.length ?? 0), 0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 히어로 */}
      <section className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-12 grid lg:grid-cols-3 gap-10">
          {/* 좌측 정보 */}
          <div className="lg:col-span-2">
            {course.category && (
              <BrandBadge variant="blue" className="mb-3">{course.category}</BrandBadge>
            )}
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3 leading-tight">{course.title}</h1>
            {course.summary && <p className="text-gray-600 mb-5 text-lg leading-relaxed">{course.summary}</p>}

            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {course._count?.enrollments ?? 0}명 수강 중
              </span>
              {course.learningPeriodDays && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  수강 기간 {course.learningPeriodDays}일
                </span>
              )}
              {totalLessons > 0 && (
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  강의 {totalLessons}개
                </span>
              )}
            </div>

            <p className="mt-4 text-sm text-gray-500">
              강사: <span className="font-semibold text-gray-700">{course.instructor?.name ?? '-'}</span>
            </p>
          </div>

          {/* 우측 신청 카드 */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-white rounded-2xl border shadow-lg p-6">
              {/* 썸네일 */}
              <div className="w-full rounded-xl mb-5 overflow-hidden bg-gray-100">
                {course.thumbnailUrl ? (
                  <Image
                    src={course.thumbnailUrl}
                    alt={course.title}
                    width={480}
                    height={300}
                    className="w-full object-cover"
                    style={{ maxHeight: '240px' }}
                  />
                ) : (
                  <div
                    className="h-40 flex items-center justify-center"
                    style={{ background: 'var(--gradient-logo)' }}
                  >
                    <BookOpen className="w-14 h-14 text-white opacity-70" />
                  </div>
                )}
              </div>

              <div className="mb-5">
                <PriceDisplay
                  price={course.price ?? 0}
                  className="text-3xl font-extrabold"
                  style={{ color: 'var(--brand-orange)' }}
                />
              </div>

              {course.enrollmentStartAt && course.enrollmentEndAt && (
                <p className="text-xs text-gray-500 mb-4">
                  수강신청 기간: {new Date(course.enrollmentStartAt).toLocaleDateString('ko-KR')} ~{' '}
                  {new Date(course.enrollmentEndAt).toLocaleDateString('ko-KR')}
                </p>
              )}

              <EnrollButton courseId={course.id} price={course.price ?? 0} />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* 강좌 소개 */}
          {course.description && (
            <section>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--brand-blue)' }}>강좌 소개</h2>
              <div className="bg-white rounded-xl border p-6 text-gray-700 leading-relaxed whitespace-pre-wrap">
                {course.description}
              </div>
            </section>
          )}

          {/* 커리큘럼 */}
          {(course.modules ?? []).length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--brand-blue)' }}>커리큘럼</h2>
              <div className="space-y-3">
                {course.modules.map((module: any, mIdx: number) => (
                  <details key={module.id} className="bg-white rounded-xl border overflow-hidden group" open={mIdx === 0}>
                    <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: 'var(--brand-blue)' }}
                        >
                          {mIdx + 1}
                        </span>
                        <span className="font-semibold text-gray-800">{module.title}</span>
                        <span className="text-xs text-gray-400">({module.lessons?.length ?? 0}강)</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" />
                    </summary>
                    <ul className="border-t divide-y divide-gray-100">
                      {(module.lessons ?? []).map((lesson: any, lIdx: number) => (
                        <li key={lesson.id} className="flex items-center gap-3 px-5 py-3 text-sm text-gray-600">
                          <span className="text-gray-300 w-5 text-right flex-shrink-0">{lIdx + 1}</span>
                          {lessonTypeIcon[lesson.lessonType] ?? <PlayCircle className="w-4 h-4 text-gray-300" />}
                          <span className="flex-1">{lesson.title}</span>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {lessonTypeLabel[lesson.lessonType] ?? ''}
                          </span>
                          {lesson.isPreview && (
                            <BrandBadge variant="orange" className="text-xs flex-shrink-0">미리보기</BrandBadge>
                          )}
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* 포함 교재 */}
          {(course.courseTextbooks ?? []).length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--brand-blue)' }}>포함 교재</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {course.courseTextbooks.map((ct: any) => (
                  <div key={ct.id} className="bg-white rounded-xl border p-4 flex items-center gap-4">
                    <div className="w-12 h-16 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                      {ct.textbook?.coverImageUrl ? (
                        <Image
                          src={ct.textbook.coverImageUrl}
                          alt={ct.textbook.title}
                          width={48}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: 'var(--gradient-logo)' }}
                        >
                          <FileText className="w-5 h-5 text-white opacity-70" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{ct.textbook?.title}</p>
                      {ct.autoGrantOnEnroll && (
                        <span className="text-xs text-green-600">수강 시 자동 제공</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 관련 홍보 영상 */}
          {shortsData.show && shortsData.items.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Video className="w-5 h-5" style={{ color: 'var(--brand-blue)' }} />
                <h2 className="text-xl font-bold" style={{ color: 'var(--brand-blue)' }}>관련 홍보 영상</h2>
              </div>
              <MainShortsSection items={shortsData.items} maxItems={3} />
            </section>
          )}
        </div>

        {/* 우측 태그 */}
        {(course.tags ?? []).length > 0 && (
          <aside className="lg:col-span-1">
            <h3 className="font-bold text-gray-700 mb-3">태그</h3>
            <div className="flex flex-wrap gap-2">
              {course.tags.map((tag: string) => (
                <BrandBadge key={tag} variant="default">{tag}</BrandBadge>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
