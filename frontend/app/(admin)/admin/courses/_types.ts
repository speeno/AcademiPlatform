export type CourseStatus = 'DRAFT' | 'UPCOMING' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
export type LessonType =
  | 'VIDEO_YOUTUBE'
  | 'VIDEO_UPLOAD'
  | 'DOCUMENT'
  | 'TEXT'
  | 'LIVE_LINK'
  | 'QUIZ';

export interface UserItem {
  id: string;
  name: string;
  email: string;
}

export interface LessonItem {
  id: string;
  title: string;
  lessonType: LessonType;
  description?: string | null;
  sortOrder: number;
  isPreview: boolean;
}

export interface ModuleItem {
  id: string;
  title: string;
  sortOrder: number;
  lessons: LessonItem[];
}

export interface CourseItem {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  price: number;
  status: CourseStatus;
  instructorId: string;
  learningPeriodDays: number | null;
  maxCapacity: number | null;
  thumbnailUrl: string | null;
  summary: string | null;
  description: string | null;
  tags: string[];
  modules?: ModuleItem[];
  _count?: { modules: number; enrollments: number };
}

export interface CourseForm {
  title: string;
  slug: string;
  category: string;
  price: number;
  status: CourseStatus;
  instructorId: string;
  learningPeriodDays: number | '';
  maxCapacity: number | '';
  thumbnailUrl: string;
  summary: string;
  description: string;
  tagsText: string;
}

export const EMPTY_FORM: CourseForm = {
  title: '',
  slug: '',
  category: '',
  price: 0,
  status: 'DRAFT',
  instructorId: '',
  learningPeriodDays: '',
  maxCapacity: '',
  thumbnailUrl: '',
  summary: '',
  description: '',
  tagsText: '',
};

export const STATUS_OPTIONS: Array<{ value: CourseStatus; label: string }> = [
  { value: 'DRAFT', label: 'DRAFT (초안)' },
  { value: 'UPCOMING', label: 'UPCOMING (예정)' },
  { value: 'ACTIVE', label: 'ACTIVE (활성)' },
  { value: 'CLOSED', label: 'CLOSED (마감)' },
  { value: 'ARCHIVED', label: 'ARCHIVED (보관)' },
];

export const LESSON_TYPE_OPTIONS: Array<{ value: LessonType; label: string }> = [
  { value: 'VIDEO_YOUTUBE', label: 'VIDEO_YOUTUBE (유튜브)' },
  { value: 'VIDEO_UPLOAD', label: 'VIDEO_UPLOAD (업로드)' },
  { value: 'DOCUMENT', label: 'DOCUMENT' },
  { value: 'TEXT', label: 'TEXT' },
  { value: 'LIVE_LINK', label: 'LIVE_LINK' },
  { value: 'QUIZ', label: 'QUIZ' },
];

const LESSON_TYPE_VALUES = new Set<LessonType>(LESSON_TYPE_OPTIONS.map((o) => o.value));

export function normalizeLessonType(value: string | null | undefined): LessonType {
  if (!value) return 'VIDEO_YOUTUBE';
  if (LESSON_TYPE_VALUES.has(value as LessonType)) return value as LessonType;
  switch (value) {
    case 'VIDEO': return 'VIDEO_YOUTUBE';
    case 'LIVE': return 'LIVE_LINK';
    case 'EXTERNAL': return 'DOCUMENT';
    default: return 'VIDEO_YOUTUBE';
  }
}

export function normalizeModules(input: ModuleItem[] | undefined): ModuleItem[] {
  return (input ?? []).map((module) => ({
    ...module,
    lessons: (module.lessons ?? []).map((lesson) => ({
      ...lesson,
      lessonType: normalizeLessonType(lesson.lessonType),
    })),
  }));
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function toForm(course: CourseItem): CourseForm {
  return {
    title: course.title ?? '',
    slug: course.slug ?? '',
    category: course.category ?? '',
    price: course.price ?? 0,
    status: course.status ?? 'DRAFT',
    instructorId: course.instructorId ?? '',
    learningPeriodDays: course.learningPeriodDays ?? '',
    maxCapacity: course.maxCapacity ?? '',
    thumbnailUrl: course.thumbnailUrl ?? '',
    summary: course.summary ?? '',
    description: course.description ?? '',
    tagsText: (course.tags ?? []).join(', '),
  };
}

export function buildPayload(form: CourseForm) {
  return {
    title: form.title.trim(),
    slug: form.slug.trim(),
    category: form.category.trim() || undefined,
    price: Math.floor(Number(form.price ?? 0)),
    status: form.status,
    instructorId: form.instructorId,
    learningPeriodDays: form.learningPeriodDays === '' ? undefined : Number(form.learningPeriodDays),
    maxCapacity: form.maxCapacity === '' ? undefined : Number(form.maxCapacity),
    thumbnailUrl: form.thumbnailUrl.trim() || undefined,
    summary: form.summary.trim() || undefined,
    description: form.description.trim() || undefined,
    tags: form.tagsText.split(',').map((tag) => tag.trim()).filter(Boolean),
  };
}
