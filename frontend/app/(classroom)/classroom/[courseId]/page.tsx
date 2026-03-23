'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import {
  PlayCircle, FileText, ChevronDown, CheckCircle2, Circle,
  Loader2, BookOpen, Award, ExternalLink,
} from 'lucide-react';
import { BrandProgress } from '@/components/ui/brand-progress';
import { BrandBadge } from '@/components/ui/brand-badge';
import { SecurePdfViewer } from '@/components/pdf-viewer/SecurePdfViewer';
import { API_BASE } from '@/lib/api-base';
import { buildAuthHeader } from '@/lib/auth';

const VideoPlayer = dynamic(
  () => import('@/components/player/VideoPlayer').then((m) => ({ default: m.VideoPlayer })),
  { ssr: false },
);
const API = API_BASE;

interface LessonProgress {
  status: string;
  watchedSeconds: number;
  completionRate: number;
  isCompleted: boolean;
}

interface Lesson {
  id: string;
  title: string;
  lessonType: string;
  sortOrder: number;
  videoAsset?: {
    durationSeconds: number | null;
    encodingStatus: string;
    sourceType: string;
    youtubeUrl: string | null;
    hlsPlaylistUrl?: string | null;
  } | null;
}

interface Module {
  id: string;
  title: string;
  sortOrder: number;
  lessons: Lesson[];
}

interface CourseData {
  course: {
    id: string;
    title: string;
    modules: Module[];
  };
  progressMap: Record<string, LessonProgress>;
  enrollment: {
    progressRate: number;
    expiresAt: string | null;
  };
}

interface CmsLessonContent {
  lessonId: string;
  contentType: 'VIDEO_MP4' | 'VIDEO_YOUTUBE' | 'DOCUMENT' | 'HTML';
  schemaJson: Record<string, unknown>;
  assets: Array<{
    id: string;
    mimeType: string;
    resolvedUrl?: string | null;
    publicUrl?: string | null;
    storageKey?: string | null;
  }>;
}

const lessonTypeIcon = (type: string, completed: boolean) => {
  if (completed) return <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />;
  const icons: Record<string, React.ReactNode> = {
    VIDEO_YOUTUBE: <PlayCircle className="w-4 h-4 text-red-400 flex-shrink-0" />,
    VIDEO_UPLOAD:  <PlayCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--brand-blue)' }} />,
    DOCUMENT:      <FileText className="w-4 h-4 text-amber-500 flex-shrink-0" />,
    TEXT:          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />,
    LIVE_LINK:     <ExternalLink className="w-4 h-4 text-green-500 flex-shrink-0" />,
    QUIZ:          <Award className="w-4 h-4 text-purple-400 flex-shrink-0" />,
  };
  return icons[type] ?? <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />;
};

export default function CoursePlayerPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();

  const [data, setData] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [cmsContent, setCmsContent] = useState<CmsLessonContent | null>(null);

  const authHeader = useCallback((): Record<string, string> => {
    return buildAuthHeader(false);
  }, []);
  const viewerAuthHeaders = useMemo(() => buildAuthHeader(false), []);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) { router.push('/login'); return; }
      try {
        const res = await fetch(`${API}/lms/courses/${courseId}`, {
          headers: buildAuthHeader(false),
          credentials: 'include',
        });
        if (!res.ok) { router.push('/classroom'); return; }
        const d: CourseData = await res.json();
        setData(d);
        // 첫 번째 레슨 자동 선택
        const firstLesson = d.course.modules?.[0]?.lessons?.[0];
        if (firstLesson) setSelectedLesson(firstLesson);
      } catch {
        router.push('/classroom');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, router]);

  // 레슨 선택 시 스트리밍/PDF 토큰 로드
  useEffect(() => {
    if (!selectedLesson) return;
    setStreamUrl(null);
    setCmsContent(null);

    const fetchContent = async () => {
      try {
        const cmsRes = await fetch(`${API}/lms/lessons/${selectedLesson.id}/content`, {
          headers: authHeader(),
          credentials: 'include',
        });
        if (cmsRes.ok) {
          const cmsData = await cmsRes.json();
          if (cmsData) {
            setCmsContent(cmsData);
            return;
          }
        }
      } catch {
        // fallback to legacy loader
      }

      if (selectedLesson.lessonType === 'VIDEO_UPLOAD') {
        try {
          const res = await fetch(`${API}/media/lessons/${selectedLesson.id}/stream-token`, {
            headers: authHeader(),
            credentials: 'include',
          });
          if (res.ok) {
            const { signedUrl } = await res.json();
            setStreamUrl(signedUrl);
          }
        } catch { /* ignore */ }
      } else if (selectedLesson.lessonType === 'DOCUMENT') {
        // PDF 뷰어 토큰은 textbook id 기반 — lessonDocument에서 textbookId 필요 (추후 연결)
      }
    };
    fetchContent();
  }, [selectedLesson, authHeader]);

  const handleProgress = useCallback(async (watchedSeconds: number, completionRate = 0) => {
    if (!selectedLesson) return;
    try {
      await fetch(`${API}/lms/lessons/${selectedLesson.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ watchedSeconds, completionRate, isCompleted: completionRate >= 90 }),
      });
    } catch { /* ignore */ }
  }, [selectedLesson, authHeader]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--brand-blue)' }} />
      </div>
    );
  }

  if (!data) return null;

  const { course, progressMap, enrollment } = data;
  const progress = selectedLesson ? progressMap[selectedLesson.id] : null;
  const cmsPrimaryAsset = cmsContent?.assets?.[0];
  const cmsAssetUrl = cmsPrimaryAsset?.resolvedUrl || cmsPrimaryAsset?.publicUrl || null;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* 좌측 커리큘럼 사이드바 */}
      <aside className="w-72 bg-white border-r overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b">
          <h2 className="font-bold text-sm text-gray-800 line-clamp-2">{course.title}</h2>
          <BrandProgress
            value={enrollment.progressRate}
            showPercent
            size="sm"
            variant="logo"
            className="mt-2"
          />
        </div>

        <nav className="p-2">
          {course.modules.map((module, mIdx) => (
            <details key={module.id} open={mIdx === 0} className="mb-1">
              <summary className="flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-gray-50 select-none text-sm font-semibold text-gray-700">
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="flex-1 line-clamp-1">{mIdx + 1}. {module.title}</span>
                <span className="text-xs font-normal text-gray-400">{module.lessons.length}강</span>
              </summary>
              <ul className="pl-4 mt-0.5 space-y-0.5">
                {module.lessons.map((lesson, lIdx) => {
                  const prog = progressMap[lesson.id];
                  const isActive = selectedLesson?.id === lesson.id;
                  return (
                    <li key={lesson.id}>
                      <button
                        onClick={() => setSelectedLesson(lesson)}
                        className={`w-full flex items-start gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                          isActive
                            ? 'text-white font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                        style={isActive ? { backgroundColor: 'var(--brand-blue)' } : {}}
                      >
                        {lessonTypeIcon(lesson.lessonType, prog?.isCompleted ?? false)}
                        <span className="flex-1 line-clamp-2">
                          {mIdx + 1}-{lIdx + 1}. {lesson.title}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </details>
          ))}
        </nav>
      </aside>

      {/* 우측 콘텐츠 영역 */}
      <main className="flex-1 overflow-y-auto bg-gray-950">
        {selectedLesson ? (
          <div>
            {/* 콘텐츠 뷰어 */}
            <div className="w-full bg-black">
              {selectedLesson.lessonType === 'VIDEO_YOUTUBE' && selectedLesson.videoAsset?.youtubeUrl ? (
                <div className="aspect-video">
                  <iframe
                    src={selectedLesson.videoAsset.youtubeUrl.replace('watch?v=', 'embed/')}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              ) : cmsContent?.contentType === 'VIDEO_YOUTUBE' && cmsContent.schemaJson?.youtubeUrl ? (
                <div className="aspect-video">
                  <iframe
                    src={String(cmsContent.schemaJson.youtubeUrl).replace('watch?v=', 'embed/')}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              ) : cmsContent?.contentType === 'VIDEO_MP4' ? (
                <video
                  className="w-full aspect-video bg-black"
                  controls
                  src={String(cmsContent.schemaJson?.videoUrl ?? cmsAssetUrl ?? '')}
                />
              ) : cmsContent?.contentType === 'HTML' ? (
                <iframe
                  title="lesson-html-content"
                  className="w-full h-[70vh] bg-white"
                  srcDoc={String(cmsContent.schemaJson?.html ?? '<p>콘텐츠가 없습니다.</p>')}
                />
              ) : cmsContent?.contentType === 'DOCUMENT' ? (
                cmsAssetUrl && cmsPrimaryAsset?.mimeType?.includes('pdf') ? (
                  <SecurePdfViewer
                    src={
                      cmsPrimaryAsset?.id
                        ? `${API}/cms/assets/${cmsPrimaryAsset.id}/file`
                        : cmsAssetUrl
                    }
                    heightClassName="h-[70vh]"
                    httpHeaders={viewerAuthHeaders}
                    withCredentials
                  />
                ) : cmsAssetUrl && cmsPrimaryAsset?.mimeType?.startsWith('image/') ? (
                  <div className="w-full h-[70vh] bg-white flex items-center justify-center">
                    <Image src={cmsAssetUrl} alt="lesson-document" width={1200} height={900} className="max-h-[70vh] w-auto object-contain" />
                  </div>
                ) : cmsAssetUrl ? (
                  <iframe title="lesson-document-content" src={cmsAssetUrl} className="w-full h-[70vh] bg-white" />
                ) : (
                  <div className="aspect-video flex items-center justify-center text-gray-400">
                    문서 에셋이 등록되지 않았습니다.
                  </div>
                )
              ) : selectedLesson.lessonType === 'VIDEO_UPLOAD' && streamUrl ? (
                <VideoPlayer
                  streamUrl={streamUrl}
                  lessonId={selectedLesson.id}
                  onProgress={handleProgress}
                />
              ) : (
                <div className="aspect-video flex flex-col items-center justify-center text-gray-400">
                  {selectedLesson.lessonType === 'VIDEO_UPLOAD' ? (
                    <><Loader2 className="w-8 h-8 animate-spin mb-3" /><p className="text-sm">스트리밍 준비 중...</p></>
                  ) : (
                    <><BookOpen className="w-12 h-12 mb-3" /><p className="text-sm">{selectedLesson.lessonType} 타입 콘텐츠</p></>
                  )}
                </div>
              )}
            </div>

            {/* 레슨 정보 */}
            <div className="p-6 bg-white">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{selectedLesson.title}</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <BrandBadge variant="default">
                      {selectedLesson.lessonType.replace('_', ' ')}
                    </BrandBadge>
                    {progress?.isCompleted && (
                      <BrandBadge variant="green">완료</BrandBadge>
                    )}
                  </div>
                </div>
              </div>

              {progress && (
                <BrandProgress
                  value={progress.completionRate}
                  label="이 강의 학습률"
                  showPercent
                  size="sm"
                  variant="logo"
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>좌측 커리큘럼에서 강의를 선택해 주세요.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
