'use client';

import { useEffect, useState } from 'react';
import { apiFetchWithAuth, getApiUrl } from '@/lib/api-client';

interface ProctorSnapshotThumbProps {
  fileUrl: string;
  capturedAt: string;
}

function resolveSnapshotPath(fileUrl: string): string {
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  return getApiUrl(fileUrl);
}

export function ProctorSnapshotThumb({ fileUrl, capturedAt }: ProctorSnapshotThumbProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const targetUrl = resolveSnapshotPath(fileUrl);
  const isExternal = fileUrl.startsWith('http://') || fileUrl.startsWith('https://');

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    const load = async () => {
      if (isExternal) {
        setSrc(targetUrl);
        return;
      }

      try {
        const res = await apiFetchWithAuth(fileUrl);
        if (!res.ok) throw new Error('snapshot load failed');
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
        setFailed(false);
      } catch {
        if (!cancelled) setFailed(true);
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileUrl, isExternal, targetUrl]);

  if (failed) {
    return (
      <a
        href={targetUrl}
        target="_blank"
        rel="noreferrer"
        className="block text-xs text-brand-blue underline"
      >
        {new Date(capturedAt).toLocaleTimeString('ko-KR')}
      </a>
    );
  }

  if (!src) {
    return <span className="text-xs text-muted-foreground">불러오는 중...</span>;
  }

  return (
    <a href={src} target="_blank" rel="noreferrer" className="block">
      <img
        src={src}
        alt={`감독 스냅샷 ${new Date(capturedAt).toLocaleTimeString('ko-KR')}`}
        className="h-14 w-20 rounded border object-cover"
      />
      <span className="mt-1 block text-xs text-brand-blue underline">
        {new Date(capturedAt).toLocaleTimeString('ko-KR')}
      </span>
    </a>
  );
}
