'use client';

import { BookOpen, PlayCircle } from 'lucide-react';

interface TocChapter {
  chapterId: string;
  title: string;
  hasVideo: boolean;
}

interface TocNavigationProps {
  chapters: TocChapter[];
  activeChapterId: string;
  onSelect: (chapterId: string) => void;
  tocText?: string;
}

export function TocNavigation({
  chapters,
  activeChapterId,
  onSelect,
  tocText,
}: TocNavigationProps) {
  return (
    <div className="space-y-2 p-2">
      <h3 className="text-xs font-semibold text-gray-500 px-2 flex items-center gap-1">
        <BookOpen className="w-3 h-3" /> 목차
      </h3>
      <div className="space-y-0.5">
        {chapters.map((ch, idx) => {
          const isActive = ch.chapterId === activeChapterId;
          return (
            <button
              key={ch.chapterId}
              type="button"
              onClick={() => onSelect(ch.chapterId)}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg flex items-center gap-2 transition ${
                isActive
                  ? 'bg-blue-50 text-blue-800 font-semibold border-l-4 border-blue-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {ch.hasVideo ? (
                <PlayCircle className="w-4 h-4 flex-shrink-0 text-blue-500" />
              ) : (
                <span className="w-4 h-4 flex-shrink-0 text-center text-xs text-gray-400">{idx + 1}</span>
              )}
              <span className="flex-1 line-clamp-2">{ch.title}</span>
            </button>
          );
        })}
      </div>

      {tocText && (
        <details className="mt-3">
          <summary className="text-xs text-gray-400 cursor-pointer px-2 hover:text-gray-600">
            전체 목차 텍스트 보기
          </summary>
          <pre className="text-xs text-gray-500 whitespace-pre-wrap mt-1 px-2 max-h-40 overflow-auto bg-gray-50 rounded p-2">
            {tocText}
          </pre>
        </details>
      )}
    </div>
  );
}
