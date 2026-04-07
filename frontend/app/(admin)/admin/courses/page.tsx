'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Save, Trash2, Loader2 } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { API_BASE } from '@/lib/api-base';
import { buildAuthHeader } from '@/lib/auth';
import { toast } from 'sonner';

type CourseStatus = 'DRAFT' | 'UPCOMING' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
type LessonType =
  | 'VIDEO_YOUTUBE'
  | 'VIDEO_UPLOAD'
  | 'DOCUMENT'
  | 'TEXT'
  | 'LIVE_LINK'
  | 'QUIZ';

interface UserItem {
  id: string;
  name: string;
  email: string;
}

interface LessonItem {
  id: string;
  title: string;
  lessonType: LessonType;
  description?: string | null;
  sortOrder: number;
  isPreview: boolean;
}

interface ModuleItem {
  id: string;
  title: string;
  sortOrder: number;
  lessons: LessonItem[];
}

interface CourseItem {
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

interface CourseForm {
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

const EMPTY_FORM: CourseForm = {
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

const STATUS_OPTIONS: Array<{ value: CourseStatus; label: string }> = [
  { value: 'DRAFT', label: 'DRAFT (초안)' },
  { value: 'UPCOMING', label: 'UPCOMING (예정)' },
  { value: 'ACTIVE', label: 'ACTIVE (활성)' },
  { value: 'CLOSED', label: 'CLOSED (마감)' },
  { value: 'ARCHIVED', label: 'ARCHIVED (보관)' },
];

const LESSON_TYPE_OPTIONS: Array<{ value: LessonType; label: string }> = [
  { value: 'VIDEO_YOUTUBE', label: 'VIDEO_YOUTUBE (유튜브)' },
  { value: 'VIDEO_UPLOAD', label: 'VIDEO_UPLOAD (업로드)' },
  { value: 'DOCUMENT', label: 'DOCUMENT' },
  { value: 'TEXT', label: 'TEXT' },
  { value: 'LIVE_LINK', label: 'LIVE_LINK' },
  { value: 'QUIZ', label: 'QUIZ' },
];

const LESSON_TYPE_VALUES = new Set<LessonType>(LESSON_TYPE_OPTIONS.map((option) => option.value));

function normalizeLessonType(value: string | null | undefined): LessonType {
  if (!value) return 'VIDEO_YOUTUBE';
  if (LESSON_TYPE_VALUES.has(value as LessonType)) return value as LessonType;
  switch (value) {
    case 'VIDEO':
      return 'VIDEO_YOUTUBE';
    case 'LIVE':
      return 'LIVE_LINK';
    case 'EXTERNAL':
      return 'DOCUMENT';
    default:
      return 'VIDEO_YOUTUBE';
  }
}

function normalizeModules(input: ModuleItem[] | undefined): ModuleItem[] {
  return (input ?? []).map((module) => ({
    ...module,
    lessons: (module.lessons ?? []).map((lesson) => ({
      ...lesson,
      lessonType: normalizeLessonType(lesson.lessonType),
    })),
  }));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function toForm(course: CourseItem): CourseForm {
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

function buildPayload(form: CourseForm) {
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

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [instructors, setInstructors] = useState<UserItem[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('');
  const [form, setForm] = useState<CourseForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastSavedText, setLastSavedText] = useState('');
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newLessonDraft, setNewLessonDraft] = useState<Record<string, { title: string; lessonType: LessonType }>>({});

  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedId),
    [courses, selectedId],
  );

  const loadDetail = useCallback(async (courseId: string) => {
    if (!courseId) return;
    const res = await fetch(`${API_BASE}/courses/admin/${courseId}`, {
      headers: buildAuthHeader(false),
      credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message ?? '강좌 상세 정보를 불러오지 못했습니다.');
    setModules(normalizeModules(data.modules));
  }, []);

  const load = useCallback(async (preferredId?: string) => {
    try {
      const [courseRes, instructorRes, operatorRes] = await Promise.all([
        fetch(`${API_BASE}/courses/admin/list?limit=200`, {
          headers: buildAuthHeader(false),
          credentials: 'include',
        }),
        fetch(`${API_BASE}/admin/users?role=INSTRUCTOR&limit=200`, {
          headers: buildAuthHeader(false),
          credentials: 'include',
        }),
        fetch(`${API_BASE}/admin/users?role=OPERATOR&limit=200`, {
          headers: buildAuthHeader(false),
          credentials: 'include',
        }),
      ]);

      const courseData = await courseRes.json().catch(() => ({ courses: [] }));
      if (!courseRes.ok) throw new Error('강좌 목록을 불러오지 못했습니다.');

      const instructorData = await instructorRes.json().catch(() => ({ users: [] }));
      const operatorData = await operatorRes.json().catch(() => ({ users: [] }));
      const mergedUsers = [...(instructorData.users ?? []), ...(operatorData.users ?? [])];
      const uniqueUsers = Array.from(new Map(mergedUsers.map((u: UserItem) => [u.id, u])).values());

      const nextCourses: CourseItem[] = courseData.courses ?? [];
      setCourses(nextCourses);
      setInstructors(uniqueUsers);

      if (nextCourses.length === 0) {
        setSelectedId('');
        setForm(EMPTY_FORM);
        setModules([]);
        return;
      }

      const targetId = preferredId ?? selectedIdRef.current;
      const target = targetId
        ? nextCourses.find((c) => c.id === targetId) ?? nextCourses[0]
        : nextCourses[0];
      setSelectedId(target.id);
      setForm(toForm(target));
      await loadDetail(target.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '강좌 목록을 불러오지 못했습니다.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [loadDetail]);

  useEffect(() => {
    load();
  }, [load]);

  const updateForm = <K extends keyof CourseForm>(key: K, value: CourseForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const selectCourse = async (course: CourseItem) => {
    setSelectedId(course.id);
    setForm(toForm(course));
    try {
      await loadDetail(course.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '강좌 상세 정보를 불러오지 못했습니다.';
      toast.error(message);
    }
  };

  const saveCourse = async () => {
    if (!selectedId) return;
    if (!form.title.trim()) return toast.error('강좌명을 입력하세요.');
    if (!form.slug.trim()) return toast.error('슬러그를 입력하세요.');
    if (!form.instructorId) return toast.error('강사를 선택하세요.');

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/courses/admin/${selectedId}`, {
        method: 'PATCH',
        headers: buildAuthHeader(),
        credentials: 'include',
        body: JSON.stringify(buildPayload(form)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? '강좌 저장에 실패했습니다.');
      await load(selectedId);
      setLastSavedText(`저장 완료: ${new Date().toLocaleTimeString('ko-KR')}`);
      toast.success('강좌가 저장되었습니다.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '강좌 저장에 실패했습니다.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const createCourse = async () => {
    if (!form.title.trim()) return toast.error('강좌명을 입력하세요.');
    if (!form.instructorId) return toast.error('강사를 선택하세요.');

    setCreating(true);
    try {
      const payload = {
        ...buildPayload(form),
        slug: (form.slug.trim() || slugify(form.title) || `course-${Date.now()}`).slice(0, 80),
      };

      const res = await fetch(`${API_BASE}/courses/admin`, {
        method: 'POST',
        headers: buildAuthHeader(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? '신규 강좌 생성에 실패했습니다.');
      const newId: string = data.id ?? '';
      await load(newId);
      setLastSavedText(`생성 완료: ${new Date().toLocaleTimeString('ko-KR')}`);
      toast.success('신규 강좌가 생성되었습니다.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '신규 강좌 생성에 실패했습니다.';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const resetForNewCourse = () => {
    setSelectedId('');
    setModules([]);
    setForm({ ...EMPTY_FORM, instructorId: instructors[0]?.id ?? '' });
    setLastSavedText('');
  };

  const addModule = async () => {
    if (!selectedId) return toast.error('먼저 강좌를 선택하세요.');
    if (!newModuleTitle.trim()) return toast.error('모듈명을 입력하세요.');
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/courses/admin/${selectedId}/modules`, {
        method: 'POST',
        headers: buildAuthHeader(),
        credentials: 'include',
        body: JSON.stringify({ title: newModuleTitle.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? '모듈 추가에 실패했습니다.');
      setNewModuleTitle('');
      await loadDetail(selectedId);
      toast.success('모듈이 추가되었습니다.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '모듈 추가에 실패했습니다.';
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const saveModule = async (moduleId: string, patch: { title?: string; sortOrder?: number }) => {
    if (!selectedId) return;
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/courses/admin/${selectedId}/modules/${moduleId}`, {
        method: 'PATCH',
        headers: buildAuthHeader(),
        credentials: 'include',
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? '모듈 저장에 실패했습니다.');
      await loadDetail(selectedId);
      toast.success('모듈이 저장되었습니다.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '모듈 저장에 실패했습니다.';
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const removeModule = async (moduleId: string) => {
    if (!selectedId) return;
    if (!confirm('모듈을 삭제하면 하위 레슨도 함께 삭제됩니다. 진행할까요?')) return;
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/courses/admin/${selectedId}/modules/${moduleId}`, {
        method: 'DELETE',
        headers: buildAuthHeader(false),
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? '모듈 삭제에 실패했습니다.');
      await loadDetail(selectedId);
      toast.success('모듈이 삭제되었습니다.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '모듈 삭제에 실패했습니다.';
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const addLesson = async (moduleId: string) => {
    const draft = newLessonDraft[moduleId] ?? { title: '', lessonType: 'VIDEO_YOUTUBE' };
    if (!draft.title.trim()) return toast.error('레슨명을 입력하세요.');
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/courses/admin/modules/${moduleId}/lessons`, {
        method: 'POST',
        headers: buildAuthHeader(),
        credentials: 'include',
        body: JSON.stringify({ title: draft.title.trim(), lessonType: draft.lessonType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? '레슨 추가에 실패했습니다.');
      setNewLessonDraft((prev) => ({ ...prev, [moduleId]: { title: '', lessonType: 'VIDEO_YOUTUBE' } }));
      if (selectedId) await loadDetail(selectedId);
      toast.success('레슨이 추가되었습니다.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '레슨 추가에 실패했습니다.';
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const saveLesson = async (
    moduleId: string,
    lessonId: string,
    patch: Partial<LessonItem>,
  ) => {
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/courses/admin/modules/${moduleId}/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: buildAuthHeader(),
        credentials: 'include',
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? '레슨 저장에 실패했습니다.');
      if (selectedId) await loadDetail(selectedId);
      toast.success('레슨이 저장되었습니다.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '레슨 저장에 실패했습니다.';
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const removeLesson = async (moduleId: string, lessonId: string) => {
    if (!confirm('레슨을 삭제하시겠습니까?')) return;
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/courses/admin/modules/${moduleId}/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: buildAuthHeader(false),
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? '레슨 삭제에 실패했습니다.');
      if (selectedId) await loadDetail(selectedId);
      toast.success('레슨이 삭제되었습니다.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '레슨 삭제에 실패했습니다.';
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="flex items-center gap-2 text-sm text-gray-500 p-8"><Loader2 className="w-4 h-4 animate-spin" />불러오는 중...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--brand-blue)' }}>교육과정 관리</h1>
          <p className="text-sm text-gray-500 mt-1">강좌 + 세부 모듈/레슨 추가·수정·삭제를 관리합니다.</p>
        </div>
        <BrandButton size="sm" variant="outline" onClick={resetForNewCourse}>
          <Plus className="w-4 h-4 mr-1" />
          신규 과정 작성
        </BrandButton>
      </div>

      <div className="grid md:grid-cols-[300px_1fr] gap-4">
        {/* sidebar */}
        <div className="bg-white rounded-xl border p-3 space-y-2 max-h-[70vh] overflow-auto">
          {courses.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">등록된 강좌가 없습니다.</p>
          ) : (
            courses.map((course) => (
              <button
                key={course.id}
                type="button"
                onClick={() => selectCourse(course)}
                className={`w-full text-left border rounded-lg p-3 transition ${
                  selectedId === course.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <p className="text-sm font-semibold text-gray-900 line-clamp-1">{course.title}</p>
                <p className="text-xs text-gray-500 mt-1">{course.slug}</p>
              </button>
            ))
          )}
        </div>

        {/* main area */}
        <div className="space-y-4">
          {/* basic fields */}
          <div className="bg-white rounded-xl border p-4 space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="강좌명 *" value={form.title} onChange={(e) => updateForm('title', e.target.value)} />
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="slug" value={form.slug} onChange={(e) => updateForm('slug', e.target.value)} />
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="카테고리" value={form.category} onChange={(e) => updateForm('category', e.target.value)} />
              <input className="border rounded-lg px-3 py-2 text-sm" type="number" placeholder="가격" value={form.price} onChange={(e) => updateForm('price', Number(e.target.value))} />
              <select className="border rounded-lg px-3 py-2 text-sm" value={form.status} onChange={(e) => updateForm('status', e.target.value as CourseStatus)}>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select className="border rounded-lg px-3 py-2 text-sm" value={form.instructorId} onChange={(e) => updateForm('instructorId', e.target.value)}>
                <option value="">강사 선택 *</option>
                {instructors.map((user) => (
                  <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                ))}
              </select>
            </div>

            {/* extended fields */}
            <details className="group">
              <summary className="text-xs text-gray-500 cursor-pointer select-none hover:text-gray-700">세부 정보 (요약·설명·썸네일·기간·정원·태그)</summary>
              <div className="grid md:grid-cols-2 gap-3 mt-3">
                <input className="border rounded-lg px-3 py-2 text-sm" placeholder="요약 (summary)" value={form.summary} onChange={(e) => updateForm('summary', e.target.value)} />
                <input className="border rounded-lg px-3 py-2 text-sm" placeholder="썸네일 URL" value={form.thumbnailUrl} onChange={(e) => updateForm('thumbnailUrl', e.target.value)} />
                <input className="border rounded-lg px-3 py-2 text-sm" type="number" placeholder="수강 기간 (일)" value={form.learningPeriodDays} onChange={(e) => updateForm('learningPeriodDays', e.target.value === '' ? '' : Number(e.target.value))} />
                <input className="border rounded-lg px-3 py-2 text-sm" type="number" placeholder="정원" value={form.maxCapacity} onChange={(e) => updateForm('maxCapacity', e.target.value === '' ? '' : Number(e.target.value))} />
                <input className="border rounded-lg px-3 py-2 text-sm md:col-span-2" placeholder="태그 (쉼표 구분)" value={form.tagsText} onChange={(e) => updateForm('tagsText', e.target.value)} />
              </div>
              <textarea className="border rounded-lg px-3 py-2 text-sm w-full mt-2" rows={3} placeholder="설명 (description)" value={form.description} onChange={(e) => updateForm('description', e.target.value)} />
            </details>

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {selectedCourse ? `선택된 강좌: ${selectedCourse.title}` : '신규 강좌 작성 모드'}
                {lastSavedText ? ` | ${lastSavedText}` : ''}
              </p>
              <div className="flex gap-2">
                {!selectedId && (
                  <BrandButton size="sm" onClick={createCourse} loading={creating}>
                    <Plus className="w-4 h-4 mr-1" />신규 생성
                  </BrandButton>
                )}
                <BrandButton size="sm" variant="secondary" onClick={saveCourse} loading={saving} disabled={!selectedId}>
                  <Save className="w-4 h-4 mr-1" />저장
                </BrandButton>
              </div>
            </div>
          </div>

          {/* modules & lessons */}
          <div className="bg-white rounded-xl border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">모듈/레슨 관리</h2>
              <div className="flex gap-2">
                <input
                  className="border rounded-lg px-3 py-2 text-sm"
                  placeholder="새 모듈명"
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                />
                <BrandButton size="sm" onClick={addModule} disabled={!selectedId || busy} loading={busy}>
                  <Plus className="w-4 h-4 mr-1" />모듈 추가
                </BrandButton>
              </div>
            </div>

            {modules.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                {selectedId ? '모듈이 없습니다. 위에서 모듈을 추가하세요.' : '강좌를 선택하거나 신규 생성 후 모듈을 추가할 수 있습니다.'}
              </p>
            ) : (
              modules.map((module) => (
                <div key={module.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      className="border rounded-lg px-3 py-2 text-sm flex-1"
                      value={module.title}
                      onChange={(e) => {
                        setModules((prev) => prev.map((m) => (m.id === module.id ? { ...m, title: e.target.value } : m)));
                      }}
                    />
                    <input
                      className="border rounded-lg px-2 py-2 text-sm w-20"
                      type="number"
                      value={module.sortOrder}
                      onChange={(e) => {
                        const value = Number(e.target.value || 0);
                        setModules((prev) => prev.map((m) => (m.id === module.id ? { ...m, sortOrder: value } : m)));
                      }}
                    />
                    <BrandButton size="sm" variant="secondary" disabled={busy} onClick={() => saveModule(module.id, { title: module.title, sortOrder: module.sortOrder })}>
                      저장
                    </BrandButton>
                    <BrandButton size="sm" variant="outline" disabled={busy} onClick={() => removeModule(module.id)}>
                      <Trash2 className="w-4 h-4" />
                    </BrandButton>
                  </div>

                  <div className="space-y-2">
                    {module.lessons.map((lesson) => (
                      <div key={lesson.id} className="grid md:grid-cols-[1fr_120px_90px_70px_80px] gap-2 items-center">
                        <input
                          className="border rounded-lg px-3 py-2 text-sm"
                          value={lesson.title}
                          onChange={(e) => {
                            setModules((prev) =>
                              prev.map((m) =>
                                m.id !== module.id ? m : {
                                  ...m,
                                  lessons: m.lessons.map((l) => (l.id === lesson.id ? { ...l, title: e.target.value } : l)),
                                },
                              ),
                            );
                          }}
                        />
                        <select
                          className="border rounded-lg px-2 py-2 text-sm"
                          value={lesson.lessonType}
                          onChange={(e) => {
                            const value = normalizeLessonType(e.target.value);
                            setModules((prev) =>
                              prev.map((m) =>
                                m.id !== module.id ? m : {
                                  ...m,
                                  lessons: m.lessons.map((l) => (l.id === lesson.id ? { ...l, lessonType: value } : l)),
                                },
                              ),
                            );
                          }}
                        >
                          {LESSON_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <input
                          className="border rounded-lg px-2 py-2 text-sm"
                          type="number"
                          value={lesson.sortOrder}
                          onChange={(e) => {
                            const value = Number(e.target.value || 0);
                            setModules((prev) =>
                              prev.map((m) =>
                                m.id !== module.id ? m : {
                                  ...m,
                                  lessons: m.lessons.map((l) => (l.id === lesson.id ? { ...l, sortOrder: value } : l)),
                                },
                              ),
                            );
                          }}
                        />
                        <label className="text-xs text-gray-600 flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={lesson.isPreview}
                            onChange={(e) => {
                              const value = e.target.checked;
                              setModules((prev) =>
                                prev.map((m) =>
                                  m.id !== module.id ? m : {
                                    ...m,
                                    lessons: m.lessons.map((l) => (l.id === lesson.id ? { ...l, isPreview: value } : l)),
                                  },
                                ),
                              );
                            }}
                          />
                          미리보기
                        </label>
                        <div className="flex gap-1">
                          <BrandButton size="sm" variant="secondary" disabled={busy} onClick={() => saveLesson(module.id, lesson.id, {
                            title: lesson.title,
                            lessonType: lesson.lessonType,
                            sortOrder: lesson.sortOrder,
                            isPreview: lesson.isPreview,
                          })}>저장</BrandButton>
                          <BrandButton size="sm" variant="outline" disabled={busy} onClick={() => removeLesson(module.id, lesson.id)}>
                            <Trash2 className="w-4 h-4" />
                          </BrandButton>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid md:grid-cols-[1fr_140px_100px] gap-2">
                    <input
                      className="border rounded-lg px-3 py-2 text-sm"
                      placeholder="새 레슨명"
                      value={newLessonDraft[module.id]?.title ?? ''}
                      onChange={(e) => setNewLessonDraft((prev) => ({
                        ...prev,
                        [module.id]: { title: e.target.value, lessonType: prev[module.id]?.lessonType ?? 'VIDEO_YOUTUBE' },
                      }))}
                    />
                    <select
                      className="border rounded-lg px-2 py-2 text-sm"
                      value={newLessonDraft[module.id]?.lessonType ?? 'VIDEO_YOUTUBE'}
                      onChange={(e) => setNewLessonDraft((prev) => ({
                        ...prev,
                        [module.id]: { title: prev[module.id]?.title ?? '', lessonType: normalizeLessonType(e.target.value) },
                      }))}
                    >
                      {LESSON_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <BrandButton size="sm" disabled={busy} onClick={() => addLesson(module.id)}>
                      <Plus className="w-4 h-4 mr-1" />레슨 추가
                    </BrandButton>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
