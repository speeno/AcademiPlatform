import { COURSE_CATEGORY_ALL } from './_types';
import type { CourseItem } from './_types';

interface Props {
  courses: CourseItem[];
  allCount: number;
  selectedId: string;
  categoryFilter: string;
  categoryOptions: string[];
  categoryCounts: Map<string, number>;
  onCategoryChange: (category: string) => void;
  onSelect: (course: CourseItem) => void;
}

export function CourseSidebar({
  courses,
  allCount,
  selectedId,
  categoryFilter,
  categoryOptions,
  categoryCounts,
  onCategoryChange,
  onSelect,
}: Props) {
  return (
    <div className="bg-white rounded-xl border p-3 space-y-3 max-h-[70vh] flex flex-col">
      <div className="space-y-2 shrink-0">
        <label className="block text-xs font-semibold text-muted-foreground" htmlFor="course-category-filter">
          카테고리
        </label>
        <select
          id="course-category-filter"
          className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          <option value={COURSE_CATEGORY_ALL}>전체 ({allCount})</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {category} ({categoryCounts.get(category) ?? 0})
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          {categoryFilter
            ? `${categoryFilter} · ${courses.length}개 표시`
            : `전체 ${allCount}개 교육과정`}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto space-y-2">
        {courses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            선택한 카테고리에 등록된 강좌가 없습니다.
          </p>
        ) : (
          courses.map((course) => (
            <button
              key={course.id}
              type="button"
              onClick={() => onSelect(course)}
              className={`w-full text-left border rounded-lg p-3 transition ${
                selectedId === course.id
                  ? 'border-brand-blue bg-brand-blue-subtle'
                  : 'hover:bg-muted/30'
              }`}
            >
              <p className="text-sm font-semibold text-foreground line-clamp-1">{course.title}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{course.slug}</p>
              {course.category && (
                <p className="text-xs text-brand-blue mt-1">{course.category}</p>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
