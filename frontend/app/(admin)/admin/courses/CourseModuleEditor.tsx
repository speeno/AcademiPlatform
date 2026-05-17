import { Plus, Trash2 } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import type { LessonItem, ModuleItem } from './_types';
import { LESSON_TYPE_OPTIONS, normalizeLessonType } from './_types';

interface Props {
  modules: ModuleItem[];
  setModules: React.Dispatch<React.SetStateAction<ModuleItem[]>>;
  selectedId: string;
  busy: boolean;
  newModuleTitle: string;
  setNewModuleTitle: (v: string) => void;
  newLessonDraft: Record<string, { title: string; lessonType: string }>;
  setNewLessonDraft: React.Dispatch<React.SetStateAction<Record<string, { title: string; lessonType: string }>>>;
  onAddModule: () => void;
  onSaveModule: (moduleId: string, patch: { title?: string; sortOrder?: number }) => void;
  onRemoveModule: (moduleId: string) => void;
  onAddLesson: (moduleId: string) => void;
  onSaveLesson: (moduleId: string, lessonId: string, patch: Partial<LessonItem>) => void;
  onRemoveLesson: (moduleId: string, lessonId: string) => void;
}

export function CourseModuleEditor({
  modules, setModules, selectedId, busy,
  newModuleTitle, setNewModuleTitle,
  newLessonDraft, setNewLessonDraft,
  onAddModule, onSaveModule, onRemoveModule,
  onAddLesson, onSaveLesson, onRemoveLesson,
}: Props) {
  return (
    <div className="bg-white rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-foreground">모듈/레슨 관리</h2>
        <div className="flex gap-2">
          <input
            className="border rounded-lg px-3 py-2 text-sm"
            placeholder="새 모듈명"
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
          />
          <BrandButton size="sm" onClick={onAddModule} disabled={!selectedId || busy} loading={busy}>
            <Plus className="w-4 h-4 mr-1" />모듈 추가
          </BrandButton>
        </div>
      </div>

      {modules.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
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
                  setModules((prev) => prev.map((m) => m.id === module.id ? { ...m, title: e.target.value } : m));
                }}
              />
              <input
                className="border rounded-lg px-2 py-2 text-sm w-20"
                type="number"
                value={module.sortOrder}
                onChange={(e) => {
                  const value = Number(e.target.value || 0);
                  setModules((prev) => prev.map((m) => m.id === module.id ? { ...m, sortOrder: value } : m));
                }}
              />
              <BrandButton size="sm" variant="secondary" disabled={busy}
                onClick={() => onSaveModule(module.id, { title: module.title, sortOrder: module.sortOrder })}>
                저장
              </BrandButton>
              <BrandButton size="sm" variant="outline" disabled={busy} onClick={() => onRemoveModule(module.id)}>
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
                      setModules((prev) => prev.map((m) =>
                        m.id !== module.id ? m : {
                          ...m,
                          lessons: m.lessons.map((l) => l.id === lesson.id ? { ...l, title: e.target.value } : l),
                        },
                      ));
                    }}
                  />
                  <select
                    className="border rounded-lg px-2 py-2 text-sm"
                    value={lesson.lessonType}
                    onChange={(e) => {
                      const value = normalizeLessonType(e.target.value);
                      setModules((prev) => prev.map((m) =>
                        m.id !== module.id ? m : {
                          ...m,
                          lessons: m.lessons.map((l) => l.id === lesson.id ? { ...l, lessonType: value } : l),
                        },
                      ));
                    }}
                  >
                    {LESSON_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <input
                    className="border rounded-lg px-2 py-2 text-sm"
                    type="number"
                    value={lesson.sortOrder}
                    onChange={(e) => {
                      const value = Number(e.target.value || 0);
                      setModules((prev) => prev.map((m) =>
                        m.id !== module.id ? m : {
                          ...m,
                          lessons: m.lessons.map((l) => l.id === lesson.id ? { ...l, sortOrder: value } : l),
                        },
                      ));
                    }}
                  />
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={lesson.isPreview}
                      onChange={(e) => {
                        const value = e.target.checked;
                        setModules((prev) => prev.map((m) =>
                          m.id !== module.id ? m : {
                            ...m,
                            lessons: m.lessons.map((l) => l.id === lesson.id ? { ...l, isPreview: value } : l),
                          },
                        ));
                      }}
                    />
                    미리보기
                  </label>
                  <div className="flex gap-1">
                    <BrandButton size="sm" variant="secondary" disabled={busy}
                      onClick={() => onSaveLesson(module.id, lesson.id, {
                        title: lesson.title,
                        lessonType: lesson.lessonType,
                        sortOrder: lesson.sortOrder,
                        isPreview: lesson.isPreview,
                      })}>저장</BrandButton>
                    <BrandButton size="sm" variant="outline" disabled={busy}
                      onClick={() => onRemoveLesson(module.id, lesson.id)}>
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
                {LESSON_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <BrandButton size="sm" disabled={busy} onClick={() => onAddLesson(module.id)}>
                <Plus className="w-4 h-4 mr-1" />레슨 추가
              </BrandButton>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
