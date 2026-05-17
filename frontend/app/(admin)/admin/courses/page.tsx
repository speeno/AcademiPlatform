'use client';

import { useEffect } from 'react';
import { Plus, Save, Loader2 } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { PageHeader } from '@/components/layout/PageHeader';
import { useCoursesAdmin } from './_useCoursesAdmin';
import { CourseSidebar } from './CourseSidebar';
import { CourseModuleEditor } from './CourseModuleEditor';
import { STATUS_OPTIONS } from './_types';

export default function AdminCoursesPage() {
  const {
    courses, instructors, modules, setModules,
    loading, selectedId, selectedCourse,
    form, updateForm, saving, creating, busy, lastSavedText,
    newModuleTitle, setNewModuleTitle, newLessonDraft, setNewLessonDraft,
    load, selectCourse, saveCourse, createCourse, resetForNewCourse,
    addModule, saveModule, removeModule, addLesson, saveLesson, removeLesson,
  } = useCoursesAdmin();

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground p-8">
      <Loader2 className="w-4 h-4 animate-spin" />불러오는 중...
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="교육과정 관리"
        description="강좌 + 세부 모듈/레슨 추가·수정·삭제를 관리합니다."
        actions={
          <BrandButton size="sm" variant="outline" onClick={resetForNewCourse}>
            <Plus className="w-4 h-4 mr-1" />신규 과정 작성
          </BrandButton>
        }
      />

      <div className="grid md:grid-cols-[300px_1fr] gap-4">
        <CourseSidebar courses={courses} selectedId={selectedId} onSelect={selectCourse} />

        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-4 space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="강좌명 *" value={form.title} onChange={(e) => updateForm('title', e.target.value)} />
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="slug" value={form.slug} onChange={(e) => updateForm('slug', e.target.value)} />
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="카테고리" value={form.category} onChange={(e) => updateForm('category', e.target.value)} />
              <input className="border rounded-lg px-3 py-2 text-sm" type="number" placeholder="가격" value={form.price} onChange={(e) => updateForm('price', Number(e.target.value))} />
              <select className="border rounded-lg px-3 py-2 text-sm" value={form.status} onChange={(e) => updateForm('status', e.target.value as typeof form.status)}>
                {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <select className="border rounded-lg px-3 py-2 text-sm" value={form.instructorId} onChange={(e) => updateForm('instructorId', e.target.value)}>
                <option value="">강사 선택 *</option>
                {instructors.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
              </select>
            </div>

            <details className="group">
              <summary className="text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground">세부 정보 (요약·설명·썸네일·기간·정원·태그)</summary>
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
              <p className="text-xs text-muted-foreground">
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

          <CourseModuleEditor
            modules={modules}
            setModules={setModules}
            selectedId={selectedId}
            busy={busy}
            newModuleTitle={newModuleTitle}
            setNewModuleTitle={setNewModuleTitle}
            newLessonDraft={newLessonDraft}
            setNewLessonDraft={setNewLessonDraft}
            onAddModule={addModule}
            onSaveModule={saveModule}
            onRemoveModule={removeModule}
            onAddLesson={addLesson}
            onSaveLesson={saveLesson}
            onRemoveLesson={removeLesson}
          />
        </div>
      </div>
    </div>
  );
}
