'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Clock, Users, BookOpen } from 'lucide-react';
import { BrandCard, BrandCardTitle } from '@/components/ui/brand-card';
import { BrandBadge } from '@/components/ui/brand-badge';
import { PriceDisplay } from '@/components/ui/price-display';
import { resolveCourseThumbnailUrl } from '@/lib/course-thumbnail';
import { ApiWarmupNotice } from '@/components/loading/ApiWarmupNotice';
import { useSlowApiFetch } from '@/lib/use-slow-api-fetch';

export type PublicCourse = {
  id: string;
  title: string;
  status: string;
  category?: string | null;
  thumbnailUrl?: string | null;
  learningPeriodDays?: number | null;
  price?: number | null;
  slug?: string | null;
  instructor?: { name?: string | null } | null;
  _count?: { enrollments?: number };
};

function parseCourses(json: unknown): PublicCourse[] {
  const data = json as { courses?: unknown };
  return Array.isArray(data?.courses) ? (data.courses as PublicCourse[]) : [];
}

function CoursesLoadError({
  status,
  elapsedSeconds,
  onRetry,
}: {
  status: 'error' | 'timeout' | 'suspended';
  elapsedSeconds: number;
  onRetry: () => void;
}) {
  const messages: Record<typeof status, { title: string; desc: string }> = {
    suspended: {
      title: 'API 서버 연결 설정을 확인해 주세요.',
      desc: '백엔드 서비스가 중지된 주소로 연결되었을 수 있습니다.',
    },
    timeout: {
      title: '아직 서버 준비가 끝나지 않았을 수 있습니다.',
      desc: '1분 정도 기다린 뒤 새로고침하거나 다시 시도해 주세요.',
    },
    error: {
      title: '교육과정 정보를 일시적으로 불러올 수 없습니다.',
      desc: '잠시 후 다시 시도해 주세요.',
    },
  };
  const { title, desc } = messages[status];

  return (
    <div className="rounded-xl border bg-white p-10 text-center text-muted-foreground">
      <p className="text-foreground font-medium">{title}</p>
      <p className="text-sm mt-1">{desc}</p>
      {elapsedSeconds > 0 && (
        <p className="text-xs mt-2 text-muted-foreground">경과 {elapsedSeconds}초</p>
      )}
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 text-sm font-medium text-brand-blue hover:underline"
      >
        다시 시도
      </button>
    </div>
  );
}

export function CoursesListClient() {
  const { status, data: courses, elapsedSeconds, retry } = useSlowApiFetch({
    path: '/courses?limit=12',
    parse: parseCourses,
  });

  const loading = status === 'loading' || status === 'idle';
  const list = courses ?? [];

  if (loading) {
    return <ApiWarmupNotice elapsedSeconds={elapsedSeconds} className="rounded-xl border bg-white p-10" />;
  }

  if (status === 'suspended' || status === 'error' || status === 'timeout') {
    return (
      <CoursesLoadError status={status} elapsedSeconds={elapsedSeconds} onRetry={retry} />
    );
  }

  if (list.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-10 text-center text-muted-foreground">
        현재 공개된 교육과정이 없습니다.
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {list.map((course) => {
        const isUpcoming = course.status === 'UPCOMING';
        const thumbnailSrc = resolveCourseThumbnailUrl(course.thumbnailUrl);
        const card = (
          <BrandCard
            hoverable={!isUpcoming}
            accent="blue"
            padding="none"
            className={`overflow-hidden h-full flex flex-col${isUpcoming ? ' opacity-75' : ''}`}
          >
            <div className="relative h-48 overflow-hidden bg-muted flex-shrink-0">
              {thumbnailSrc ? (
                <Image
                  src={thumbnailSrc}
                  alt={course.title}
                  width={400}
                  height={192}
                  unoptimized
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div
                  className="h-full flex items-center justify-center"
                  style={{ background: 'var(--gradient-logo)' }}
                >
                  <BookOpen className="w-10 h-10 text-white opacity-60" />
                </div>
              )}
              {isUpcoming && (
                <div className="absolute top-3 right-3">
                  <BrandBadge variant="orange" className="text-xs font-bold shadow-sm">
                    예정
                  </BrandBadge>
                </div>
              )}
            </div>

            <div className="p-5 flex flex-col flex-1">
              {course.category && (
                <BrandBadge variant="blue" className="mb-2 self-start">
                  {course.category}
                </BrandBadge>
              )}
              <BrandCardTitle className="mb-2 line-clamp-2">{course.title}</BrandCardTitle>
              <p className="text-xs text-muted-foreground mb-3">강사: {course.instructor?.name ?? '-'}</p>

              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                {course.learningPeriodDays && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {course.learningPeriodDays}일
                  </span>
                )}
                {!isUpcoming && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {course._count?.enrollments ?? 0}명 수강 중
                  </span>
                )}
              </div>

              <div className="mt-auto flex items-center justify-between">
                {isUpcoming ? (
                  <span className="text-sm font-medium text-muted-foreground">가격 미정</span>
                ) : (
                  <PriceDisplay
                    price={course.price ?? 0}
                    className="text-lg font-extrabold text-brand-orange"
                  />
                )}
                <span
                  className={cn(
                    'text-xs font-medium',
                    isUpcoming ? 'text-muted-foreground' : 'text-brand-blue',
                  )}
                >
                  {isUpcoming ? '준비 중' : '상세 보기 →'}
                </span>
              </div>
            </div>
          </BrandCard>
        );

        return isUpcoming ? (
          <div key={course.id} className="cursor-default">
            {card}
          </div>
        ) : (
          <Link key={course.id} href={`/courses/${course.slug ?? course.id}`}>
            {card}
          </Link>
        );
      })}
    </div>
  );
}
