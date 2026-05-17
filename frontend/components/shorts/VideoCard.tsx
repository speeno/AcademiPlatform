'use client';

import { PlayCircle } from 'lucide-react';

export interface VideoItem {
  id: string;
  type: 'youtube' | 'instagram';
  videoId: string;
  title: string;
  thumbnailUrl?: string;
  linkUrl?: string;
  isActive?: boolean;
}

function resolveThumb(item: VideoItem): string {
  if (item.thumbnailUrl) return item.thumbnailUrl;
  if (item.type === 'youtube' && item.videoId) {
    return `https://img.youtube.com/vi/${item.videoId}/0.jpg`;
  }
  return '';
}

function resolveLink(item: VideoItem): string {
  if (item.linkUrl) return item.linkUrl;
  if (item.type === 'youtube' && item.videoId) {
    return `https://youtube.com/shorts/${item.videoId}`;
  }
  return '#';
}

const platformBadge: Record<string, { label: string; bg: string; color: string }> = {
  youtube: { label: 'YouTube', bg: '#FF0000', color: '#fff' },
  instagram: { label: 'Instagram', bg: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', color: '#fff' },
};

export function VideoCard({ item }: { item: VideoItem }) {
  const thumb = resolveThumb(item);
  const link = resolveLink(item);
  const badge = platformBadge[item.type] ?? platformBadge.youtube;
  const isVertical = item.type === 'youtube';

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl overflow-hidden border bg-white hover:shadow-lg transition-shadow"
    >
      <div
        className={`relative bg-brand-blue-dark overflow-hidden ${isVertical ? 'aspect-[9/16]' : 'aspect-square'}`}
      >
        {thumb ? (
          <img
            src={thumb}
            alt={item.title}
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--gradient-logo)' }}>
            <PlayCircle className="w-10 h-10 text-white/60" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <PlayCircle className="w-8 h-8 text-brand-blue"  />
          </div>
        </div>
        <div
          className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{ background: badge.bg, color: badge.color }}
        >
          {badge.label}
        </div>
      </div>
      {item.title && (
        <div className="p-3">
          <p className="text-sm font-medium text-foreground line-clamp-2">{item.title}</p>
        </div>
      )}
    </a>
  );
}
