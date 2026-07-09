'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { apiFetchWithAuth, parseJsonSafe } from '@/lib/api-client';

interface CourseOption {
  id: string;
  title: string;
}

interface CourseSearchSelectProps {
  value: CourseOption | null;
  onChange: (course: CourseOption | null) => void;
  disabled?: boolean;
}

/** 연계 강좌 검색 선택 — 디바운스 검색 후 드롭다운에서 선택, 선택 시 칩 표시 */
export function CourseSearchSelect({ value, onChange, disabled }: CourseSearchSelectProps) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<CourseOption[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await apiFetchWithAuth(
        `/training/courses?search=${encodeURIComponent(query.trim())}`,
      );
      if (!res.ok) return;
      const data = await parseJsonSafe<{ courses: CourseOption[] }>(res, { courses: [] });
      setOptions(data.courses);
      setOpen(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (value) {
    return (
      <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-brand-blue-subtle px-3 py-2 text-sm text-brand-blue">
        {value.title}
        {!disabled && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-brand-blue/70 hover:text-brand-blue"
            aria-label="연계 강좌 해제"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </span>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => options.length > 0 && setOpen(true)}
        placeholder="강좌명으로 검색 (선택 사항)"
        disabled={disabled}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm"
      />
      {open && options.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          {options.map((course) => (
            <li key={course.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50"
                onClick={() => {
                  onChange(course);
                  setQuery('');
                  setOpen(false);
                }}
              >
                {course.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
