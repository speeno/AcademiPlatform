'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { API_BASE } from '@/lib/api-base';
import { buildAuthHeader } from '@/lib/auth';
import {
  CourseItem, CourseForm, LessonItem, ModuleItem,
  EMPTY_FORM, buildPayload, normalizeModules, slugify, toForm,
} from './_types';

export function useCoursesAdmin() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [instructors, setInstructors] = useState<{ id: string; name: string; email: string }[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('');
  const [form, setForm] = useState<CourseForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastSavedText, setLastSavedText] = useState('');
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newLessonDraft, setNewLessonDraft] = useState<Record<string, { title: string; lessonType: string }>>({});

  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedId),
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
        fetch(`${API_BASE}/courses/admin/list?limit=200`, { headers: buildAuthHeader(false), credentials: 'include' }),
        fetch(`${API_BASE}/admin/users?role=INSTRUCTOR&limit=200`, { headers: buildAuthHeader(false), credentials: 'include' }),
        fetch(`${API_BASE}/admin/users?role=OPERATOR&limit=200`, { headers: buildAuthHeader(false), credentials: 'include' }),
      ]);

      const courseData = await courseRes.json().catch(() => ({ courses: [] }));
      if (!courseRes.ok) throw new Error('강좌 목록을 불러오지 못했습니다.');

      const instructorData = await instructorRes.json().catch(() => ({ users: [] }));
      const operatorData = await operatorRes.json().catch(() => ({ users: [] }));
      const merged = [...(instructorData.users ?? []), ...(operatorData.users ?? [])];
      const unique = Array.from(new Map(merged.map((u: { id: string }) => [u.id, u])).values());

      const nextCourses: CourseItem[] = courseData.courses ?? [];
      setCourses(nextCourses);
      setInstructors(unique as { id: string; name: string; email: string }[]);

      if (nextCourses.length === 0) {
        setSelectedId('');
        setForm(EMPTY_FORM);
        setModules([]);
        return;
      }

      const targetId = preferredId ?? selectedIdRef.current;
      const target = targetId ? nextCourses.find((c) => c.id === targetId) ?? nextCourses[0] : nextCourses[0];
      setSelectedId(target.id);
      setForm(toForm(target));
      await loadDetail(target.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '강좌 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [loadDetail]);

  const updateForm = <K extends keyof CourseForm>(key: K, value: CourseForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const selectCourse = async (course: CourseItem) => {
    setSelectedId(course.id);
    setForm(toForm(course));
    try { await loadDetail(course.id); } catch (err) {
      toast.error(err instanceof Error ? err.message : '강좌 상세 정보를 불러오지 못했습니다.');
    }
  };

  const saveCourse = async () => {
    if (!selectedId) return;
    if (!form.title.trim()) return void toast.error('강좌명을 입력하세요.');
    if (!form.slug.trim()) return void toast.error('슬러그를 입력하세요.');
    if (!form.instructorId) return void toast.error('강사를 선택하세요.');
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/courses/admin/${selectedId}`, {
        method: 'PATCH', headers: buildAuthHeader(), credentials: 'include',
        body: JSON.stringify(buildPayload(form)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? '강좌 저장에 실패했습니다.');
      await load(selectedId);
      setLastSavedText(`저장 완료: ${new Date().toLocaleTimeString('ko-KR')}`);
      toast.success('강좌가 저장되었습니다.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '강좌 저장에 실패했습니다.');
    } finally { setSaving(false); }
  };

  const createCourse = async () => {
    if (!form.title.trim()) return void toast.error('강좌명을 입력하세요.');
    if (!form.instructorId) return void toast.error('강사를 선택하세요.');
    setCreating(true);
    try {
      const payload = {
        ...buildPayload(form),
        slug: (form.slug.trim() || slugify(form.title) || `course-${Date.now()}`).slice(0, 80),
      };
      const res = await fetch(`${API_BASE}/courses/admin`, {
        method: 'POST', headers: buildAuthHeader(), credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? '신규 강좌 생성에 실패했습니다.');
      await load(data.id ?? '');
      setLastSavedText(`생성 완료: ${new Date().toLocaleTimeString('ko-KR')}`);
      toast.success('신규 강좌가 생성되었습니다.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '신규 강좌 생성에 실패했습니다.');
    } finally { setCreating(false); }
  };

  const resetForNewCourse = () => {
    setSelectedId('');
    setModules([]);
    setForm({ ...EMPTY_FORM, instructorId: instructors[0]?.id ?? '' });
    setLastSavedText('');
  };

  const addModule = async () => {
    if (!selectedId) return void toast.error('먼저 강좌를 선택하세요.');
    if (!newModuleTitle.trim()) return void toast.error('모듈명을 입력하세요.');
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/courses/admin/${selectedId}/modules`, {
        method: 'POST', headers: buildAuthHeader(), credentials: 'include',
        body: JSON.stringify({ title: newModuleTitle.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? '모듈 추가에 실패했습니다.');
      setNewModuleTitle('');
      await loadDetail(selectedId);
      toast.success('모듈이 추가되었습니다.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '모듈 추가에 실패했습니다.');
    } finally { setBusy(false); }
  };

  const saveModule = async (moduleId: string, patch: { title?: string; sortOrder?: number }) => {
    if (!selectedId) return;
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/courses/admin/${selectedId}/modules/${moduleId}`, {
        method: 'PATCH', headers: buildAuthHeader(), credentials: 'include',
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? '모듈 저장에 실패했습니다.');
      await loadDetail(selectedId);
      toast.success('모듈이 저장되었습니다.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '모듈 저장에 실패했습니다.');
    } finally { setBusy(false); }
  };

  const removeModule = async (moduleId: string) => {
    if (!selectedId) return;
    if (!confirm('모듈을 삭제하면 하위 레슨도 함께 삭제됩니다. 진행할까요?')) return;
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/courses/admin/${selectedId}/modules/${moduleId}`, {
        method: 'DELETE', headers: buildAuthHeader(false), credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? '모듈 삭제에 실패했습니다.');
      await loadDetail(selectedId);
      toast.success('모듈이 삭제되었습니다.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '모듈 삭제에 실패했습니다.');
    } finally { setBusy(false); }
  };

  const addLesson = async (moduleId: string) => {
    const draft = newLessonDraft[moduleId] ?? { title: '', lessonType: 'VIDEO_YOUTUBE' };
    if (!draft.title.trim()) return void toast.error('레슨명을 입력하세요.');
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/courses/admin/modules/${moduleId}/lessons`, {
        method: 'POST', headers: buildAuthHeader(), credentials: 'include',
        body: JSON.stringify({ title: draft.title.trim(), lessonType: draft.lessonType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? '레슨 추가에 실패했습니다.');
      setNewLessonDraft((prev) => ({ ...prev, [moduleId]: { title: '', lessonType: 'VIDEO_YOUTUBE' } }));
      if (selectedId) await loadDetail(selectedId);
      toast.success('레슨이 추가되었습니다.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '레슨 추가에 실패했습니다.');
    } finally { setBusy(false); }
  };

  const saveLesson = async (moduleId: string, lessonId: string, patch: Partial<LessonItem>) => {
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/courses/admin/modules/${moduleId}/lessons/${lessonId}`, {
        method: 'PATCH', headers: buildAuthHeader(), credentials: 'include',
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? '레슨 저장에 실패했습니다.');
      if (selectedId) await loadDetail(selectedId);
      toast.success('레슨이 저장되었습니다.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '레슨 저장에 실패했습니다.');
    } finally { setBusy(false); }
  };

  const removeLesson = async (moduleId: string, lessonId: string) => {
    if (!confirm('레슨을 삭제하시겠습니까?')) return;
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/courses/admin/modules/${moduleId}/lessons/${lessonId}`, {
        method: 'DELETE', headers: buildAuthHeader(false), credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? '레슨 삭제에 실패했습니다.');
      if (selectedId) await loadDetail(selectedId);
      toast.success('레슨이 삭제되었습니다.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '레슨 삭제에 실패했습니다.');
    } finally { setBusy(false); }
  };

  return {
    courses, instructors, modules, setModules,
    loading, selectedId, selectedCourse,
    form, updateForm, saving, creating, busy,
    lastSavedText, newModuleTitle, setNewModuleTitle,
    newLessonDraft, setNewLessonDraft,
    load, selectCourse, saveCourse, createCourse, resetForNewCourse,
    addModule, saveModule, removeModule,
    addLesson, saveLesson, removeLesson,
  };
}
