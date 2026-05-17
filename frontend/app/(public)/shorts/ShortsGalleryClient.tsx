'use client';

import { useState } from 'react';
import { VideoCard, type VideoItem } from '@/components/shorts/VideoCard';

const TABS = [
  { key: 'all', label: '전체' },
  { key: 'youtube', label: 'YouTube Shorts' },
  { key: 'instagram', label: 'Instagram' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function ShortsGalleryClient({ items }: { items: VideoItem[] }) {
  const [tab, setTab] = useState<TabKey>('all');

  const filtered = tab === 'all' ? items : items.filter((i) => i.type === tab);

  const hasYoutube = items.some((i) => i.type === 'youtube');
  const hasInstagram = items.some((i) => i.type === 'instagram');
  const showTabs = hasYoutube && hasInstagram;

  return (
    <div>
      {showTabs && (
        <div className="flex gap-2 mb-8 justify-center">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'text-white'
                  : 'text-muted-foreground bg-muted hover:bg-muted'
              }`}
              style={tab === t.key ? { backgroundColor: 'var(--brand-blue)' } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-10">
          해당 유형의 영상이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <VideoCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
