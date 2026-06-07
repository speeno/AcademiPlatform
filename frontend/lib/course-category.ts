export type CourseCategoryFilterInput = {
  category?: string | null;
  title?: string | null;
  slug?: string | null;
  thumbnailUrl?: string | null;
};

/** 관리자·DB 기준 ISO/자격증 교육 카테고리 */
export const CERTIFICATION_CATEGORY = 'AI 국제자격증';

export function isCertificationCourse(course: CourseCategoryFilterInput): boolean {
  const category = (course.category ?? '').trim();
  if (category === CERTIFICATION_CATEGORY) return true;
  if (category.includes('국제자격증')) return true;

  const slug = (course.slug ?? '').toLowerCase();
  if (slug.startsWith('ai-expert-') || slug.startsWith('ai-prompt-') || slug.includes('iso')) {
    return true;
  }

  const title = (course.title ?? '').toLowerCase();
  return title.includes('iso/iec') || title.includes('국제자격증');
}

export function isHarnessCourse(course: CourseCategoryFilterInput): boolean {
  const category = (course.category ?? '').trim();
  if (category === 'AI Harness') return true;

  const thumb = course.thumbnailUrl ?? '';
  if (thumb.includes('/covers/harness-')) return true;

  const title = (course.title ?? '').toLowerCase();
  if (title.includes('harness') || title.includes('하네스')) return true;

  const cat = category.toLowerCase();
  return cat.includes('harness') || cat.includes('하네스');
}

/** Harness 프로그램·기업 교육: 자격증 과정 제외 (Harness + 기타 일반 교육) */
export function isNonCertificationCourse(course: CourseCategoryFilterInput): boolean {
  return !isCertificationCourse(course);
}

export type CourseListAudience = 'certification' | 'nonCertification' | 'nonHarness';

export function filterCoursesByAudience<T extends CourseCategoryFilterInput>(
  courses: T[],
  audience: CourseListAudience,
): T[] {
  switch (audience) {
    case 'certification':
      return courses.filter(isCertificationCourse);
    case 'nonCertification':
      return courses.filter(isNonCertificationCourse);
    case 'nonHarness':
      return courses.filter((course) => !isHarnessCourse(course));
    default:
      return courses;
  }
}
