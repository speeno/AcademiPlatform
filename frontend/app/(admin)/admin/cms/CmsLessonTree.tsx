import type { CmsTreeModule } from './_types';

interface Props {
  modules: CmsTreeModule[];
  selectedLessonId: string;
  onSelectLesson: (id: string) => void;
}

export function CmsLessonTree({ modules, selectedLessonId, onSelectLesson }: Props) {
  return (
    <div className="bg-white rounded-xl border p-3 space-y-3 max-h-[72vh] overflow-auto">
      {modules.map((module) => (
        <div key={module.id}>
          <p className="text-xs font-semibold text-muted-foreground mb-1">{module.title}</p>
          <div className="space-y-1">
            {module.lessons.map((lesson) => (
              <button
                key={lesson.id}
                type="button"
                onClick={() => onSelectLesson(lesson.id)}
                className={`w-full text-left border rounded-lg px-3 py-2 text-sm ${
                  selectedLessonId === lesson.id ? 'border-brand-blue bg-brand-blue-subtle' : 'hover:bg-muted/30'
                }`}
              >
                <p className="font-medium">{lesson.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {lesson.contentItem?.contentType ?? '미작성'} | {lesson.contentItem?.status ?? 'DRAFT'}
                </p>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
