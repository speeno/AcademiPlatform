'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Eye, FileWarning } from 'lucide-react';
import { API_BASE } from '@/lib/api-base';
import { buildAuthHeader } from '@/lib/auth';
import { useAuthedBlobUrl } from '@/lib/use-authed-blob-url';
import { LessonFormatViewer } from '@/components/cms/LessonFormatViewer';
import type { CmsAsset, ContentType } from './_types';

const CoursePackageViewer = dynamic(
  () => import('@/components/course-package/CoursePackageViewer').then((m) => ({ default: m.CoursePackageViewer })),
  { ssr: false },
);

interface Props {
  contentType: ContentType;
  assets: CmsAsset[];
  youtubeUrl: string;
  htmlContent: string;
  videoUrl: string;
  lessonId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  packageSchema: Record<string, any> | null;
}

function EmptyPreview({ message }: { message: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 text-sm text-muted-foreground">
      <FileWarning className="h-6 w-6 opacity-50" />
      <p>{message}</p>
    </div>
  );
}

export function CmsContentPreview({
  contentType, assets, youtubeUrl, htmlContent, videoUrl, lessonId, packageSchema,
}: Props) {
  const authHeaders = useMemo(() => buildAuthHeader(false), []);

  // 편집자용 스트리밍 엔드포인트 — DRAFT(미게시) 미리보기도 가능
  const assetFileUrl = (assetId: string) =>
    `${API_BASE}/cms/lessons/${lessonId}/assets/${assetId}/file`;

  const videoAsset = assets.find((a) => a.mimeType?.startsWith('video/')) ?? null;
  const mp4Src = contentType === 'VIDEO_MP4' && !videoUrl && videoAsset
    ? assetFileUrl(videoAsset.id)
    : null;
  const { url: mp4Blob } = useAuthedBlobUrl(mp4Src, authHeaders);

  const embedYoutube = (url: string) =>
    url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/');

  let body: React.ReactNode;

  if (contentType === 'VIDEO_YOUTUBE') {
    body = youtubeUrl ? (
      <div className="aspect-video">
        <iframe
          src={embedYoutube(youtubeUrl)}
          className="h-full w-full rounded-lg"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    ) : (
      <EmptyPreview message="YouTube URL을 입력하면 미리보기가 표시됩니다." />
    );
  } else if (contentType === 'VIDEO_MP4') {
    const src = videoUrl || mp4Blob || '';
    body = src ? (
      <video src={src} controls className="aspect-video w-full rounded-lg bg-black" />
    ) : (
      <EmptyPreview message="영상 URL을 입력하거나 mp4 파일을 업로드하세요." />
    );
  } else if (contentType === 'HTML' || contentType === 'DOCUMENT') {
    const hasAny = htmlContent.trim() || assets.length > 0;
    body = hasAny ? (
      <div className="h-[60vh] overflow-hidden rounded-lg border">
        <LessonFormatViewer
          contentType={contentType}
          schemaJson={{ html: htmlContent }}
          assets={assets}
          assetFileUrl={assetFileUrl}
          authHeaders={authHeaders}
          heightClassName="h-[calc(60vh-2.25rem)]"
        />
      </div>
    ) : (
      <EmptyPreview message="HTML 내용을 입력하거나 문서/이미지 파일을 업로드하면 미리보기가 표시됩니다." />
    );
  } else if (contentType === 'COURSE_PACKAGE') {
    body = packageSchema?.chapters ? (
      <div className="h-[60vh]">
        <CoursePackageViewer
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          schema={packageSchema as any}
          assetBaseUrl={`${API_BASE}/cms/package-asset`}
          lessonId={lessonId}
          authHeaders={authHeaders}
        />
      </div>
    ) : (
      <EmptyPreview message="강의 패키지 ZIP을 업로드하면 미리보기가 표시됩니다." />
    );
  } else {
    body = <EmptyPreview message="미리보기를 사용할 수 없습니다." />;
  }

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Eye className="h-3.5 w-3.5" /> 미리보기 ({contentType})
      </p>
      {body}
    </div>
  );
}
