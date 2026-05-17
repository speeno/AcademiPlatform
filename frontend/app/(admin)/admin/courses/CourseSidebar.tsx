import type { CourseItem } from './_types';

interface Props {
  courses: CourseItem[];
  selectedId: string;
  onSelect: (course: CourseItem) => void;
}

export function CourseSidebar({ courses, selectedId, onSelect }: Props) {
  if (courses.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-3 max-h-[70vh] overflow-auto">
        <p className="text-sm text-muted-foreground text-center py-6">등록된 강좌가 없습니다.</p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl border p-3 space-y-2 max-h-[70vh] overflow-auto">
      {courses.map((course) => (
        <button
          key={course.id}
          type="button"
          onClick={() => onSelect(course)}
          className={`w-full text-left border rounded-lg p-3 transition ${
            selectedId === course.id ? 'border-brand-blue bg-brand-blue-subtle' : 'hover:bg-muted/30'
          }`}
        >
          <p className="text-sm font-semibold text-foreground line-clamp-1">{course.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{course.slug}</p>
        </button>
      ))}
    </div>
  );
}
