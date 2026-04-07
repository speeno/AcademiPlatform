'use client';

import { useEffect, useRef } from 'react';

interface ScriptBlock {
  block_id: string;
  narration: string;
  emphasis_words?: string[];
  on_screen_text?: string;
  tone?: string;
  start_time?: number;
  end_time?: number;
}

interface ScriptSyncPanelProps {
  blocks: ScriptBlock[];
  currentTime: number;
  onSeek: (time: number) => void;
}

function parseTimeFromBlockId(blockId: string): number | null {
  const match = blockId.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export function ScriptSyncPanel({ blocks, currentTime, onSeek }: ScriptSyncPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  const activeIndex = blocks.findIndex((block, i) => {
    const start = block.start_time ?? parseTimeFromBlockId(block.block_id) ?? i * 30;
    const nextBlock = blocks[i + 1];
    const end = block.end_time ?? nextBlock?.start_time ?? (parseTimeFromBlockId(nextBlock?.block_id) ?? (start + 30));
    return currentTime >= start && currentTime < end;
  });

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex]);

  if (!blocks || blocks.length === 0) {
    return <p className="text-xs text-gray-400 p-3">스크립트 정보가 없습니다.</p>;
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto space-y-1 p-2">
      {blocks.map((block, i) => {
        const isActive = i === activeIndex;
        const startTime = block.start_time ?? parseTimeFromBlockId(block.block_id) ?? i * 30;

        return (
          <div
            key={block.block_id}
            ref={isActive ? activeRef : undefined}
            onClick={() => onSeek(startTime)}
            className={`rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${
              isActive
                ? 'bg-blue-50 border-l-4 border-blue-500 text-gray-900'
                : 'hover:bg-gray-50 text-gray-600'
            }`}
          >
            <p className="leading-relaxed">
              {renderHighlightedText(block.narration, block.emphasis_words)}
            </p>
            {block.on_screen_text && (
              <p className="text-xs text-blue-500 mt-1 italic">{block.on_screen_text}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function renderHighlightedText(text: string, emphasisWords?: string[]): React.ReactNode {
  if (!emphasisWords || emphasisWords.length === 0) return text;

  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  for (const word of emphasisWords) {
    const idx = remaining.indexOf(word);
    if (idx === -1) continue;
    if (idx > 0) {
      parts.push(remaining.slice(0, idx));
    }
    parts.push(
      <span key={keyIdx++} className="font-semibold text-blue-700 bg-blue-100 px-0.5 rounded">
        {word}
      </span>,
    );
    remaining = remaining.slice(idx + word.length);
  }
  if (remaining) parts.push(remaining);
  return parts.length > 0 ? parts : text;
}
