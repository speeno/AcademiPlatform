'use client';

import { useCallback, useState } from 'react';
import { VideoSubtitlePlayer } from './VideoSubtitlePlayer';
import { ScriptSyncPanel } from './ScriptSyncPanel';
import { QuizPanel } from './QuizPanel';
import { TocNavigation } from './TocNavigation';
import { FileText, HelpCircle, BookOpen, Lightbulb } from 'lucide-react';

interface ChapterData {
  chapterId: string;
  title: string;
  videoStorageKey?: string | null;
  subtitleStorageKey?: string | null;
  subtitleVtt?: string | null;
  script?: {
    script_blocks?: Array<{
      block_id: string;
      narration: string;
      emphasis_words?: string[];
      on_screen_text?: string;
      tone?: string;
      start_time?: number;
      end_time?: number;
    }>;
  };
  quiz?: {
    questions?: Array<{
      question_id: string;
      question: string;
      type?: string;
      options: Array<{ label: string; text: string }>;
      correct_answer: string;
      explanation?: string;
      difficulty?: string;
    }>;
  };
  brief?: {
    summary?: string;
    key_concepts?: Array<{ term: string; definition: string }>;
    learning_objectives?: string[];
  };
}

interface CoursePackageSchema {
  chapters: ChapterData[];
  toc?: string;
  lmsMetadata?: Record<string, unknown>;
}

interface CoursePackageViewerProps {
  schema: CoursePackageSchema;
  assetBaseUrl: string;
  lessonId?: string;
  authHeaders?: Record<string, string>;
}

type SideTab = 'toc' | 'script' | 'quiz' | 'brief';

export function CoursePackageViewer({
  schema,
  assetBaseUrl,
  lessonId,
  authHeaders,
}: CoursePackageViewerProps) {
  const chapters = schema.chapters ?? [];
  const [activeChapterId, setActiveChapterId] = useState(chapters[0]?.chapterId ?? '');
  const [currentTime, setCurrentTime] = useState(0);
  const [sideTab, setSideTab] = useState<SideTab>('toc');

  const activeChapter = chapters.find((c) => c.chapterId === activeChapterId);

  const buildAssetUrl = useCallback(
    (storageKey: string | null | undefined, lessonId?: string) => {
      if (!storageKey) return '';
      const params = new URLSearchParams({ storageKey });
      if (lessonId) params.set('lessonId', lessonId);
      return `${assetBaseUrl}?${params.toString()}`;
    },
    [assetBaseUrl],
  );

  const videoUrl = activeChapter?.videoStorageKey
    ? buildAssetUrl(activeChapter.videoStorageKey, lessonId)
    : '';

  const subtitleBlobUrl = activeChapter?.subtitleVtt
    ? URL.createObjectURL(new Blob([activeChapter.subtitleVtt], { type: 'text/vtt' }))
    : activeChapter?.subtitleStorageKey
      ? buildAssetUrl(activeChapter.subtitleStorageKey, lessonId)
      : null;

  const handleChapterSelect = (chapterId: string) => {
    setActiveChapterId(chapterId);
    setCurrentTime(0);
    setSideTab('script');
  };

  const handleVideoEnded = () => {
    const nextIdx = chapters.findIndex((c) => c.chapterId === activeChapterId) + 1;
    if (nextIdx < chapters.length) {
      setSideTab('quiz');
    }
  };

  const scriptBlocks = activeChapter?.script?.script_blocks ?? [];
  const quizQuestions = activeChapter?.quiz?.questions ?? [];
  const keyConcepts = activeChapter?.brief?.key_concepts ?? [];

  const sideTabs: Array<{ id: SideTab; label: string; icon: React.ReactNode }> = [
    { id: 'toc', label: '목차', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'script', label: '스크립트', icon: <FileText className="w-4 h-4" /> },
    { id: 'quiz', label: '퀴즈', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'brief', label: '요약', icon: <Lightbulb className="w-4 h-4" /> },
  ];

  return (
    <div className="flex h-full">
      {/* main video area */}
      <div className="flex-1 flex flex-col bg-black">
        {videoUrl ? (
          <VideoSubtitlePlayer
            videoUrl={videoUrl}
            subtitleVttUrl={subtitleBlobUrl}
            onTimeUpdate={setCurrentTime}
            onEnded={handleVideoEnded}
          />
        ) : (
          <div className="aspect-video flex items-center justify-center text-gray-400 bg-gray-900">
            <p className="text-sm">
              {activeChapter ? `${activeChapter.title} - 영상이 없습니다.` : '챕터를 선택하세요.'}
            </p>
          </div>
        )}

        {/* chapter info bar */}
        <div className="bg-gray-900 px-4 py-2 flex items-center gap-3">
          <span className="text-white text-sm font-medium">
            {activeChapter?.title ?? ''}
          </span>
          {activeChapter?.brief?.summary && (
            <span className="text-gray-400 text-xs truncate flex-1">
              {activeChapter.brief.summary}
            </span>
          )}
        </div>
      </div>

      {/* side panel */}
      <div className="w-80 bg-white border-l flex flex-col">
        {/* tab buttons */}
        <div className="flex border-b">
          {sideTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSideTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium transition ${
                sideTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* tab content */}
        <div className="flex-1 overflow-y-auto">
          {sideTab === 'toc' && (
            <TocNavigation
              chapters={chapters.map((c) => ({
                chapterId: c.chapterId,
                title: c.title,
                hasVideo: !!c.videoStorageKey,
              }))}
              activeChapterId={activeChapterId}
              onSelect={handleChapterSelect}
              tocText={schema.toc}
            />
          )}
          {sideTab === 'script' && (
            <ScriptSyncPanel
              blocks={scriptBlocks}
              currentTime={currentTime}
              onSeek={(time) => {
                setCurrentTime(time);
              }}
            />
          )}
          {sideTab === 'quiz' && (
            <QuizPanel
              questions={quizQuestions}
              chapterTitle={activeChapter?.title}
            />
          )}
          {sideTab === 'brief' && (
            <div className="p-3 space-y-3">
              {activeChapter?.brief?.learning_objectives && activeChapter.brief.learning_objectives.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 mb-1">학습 목표</h4>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {activeChapter.brief.learning_objectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}
              {keyConcepts.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 mb-1">핵심 개념</h4>
                  <div className="space-y-1">
                    {keyConcepts.map((concept, i) => (
                      <details key={i} className="border rounded-lg">
                        <summary className="text-sm font-medium text-gray-800 px-3 py-2 cursor-pointer hover:bg-gray-50">
                          {concept.term}
                        </summary>
                        <p className="text-xs text-gray-600 px-3 pb-2">{concept.definition}</p>
                      </details>
                    ))}
                  </div>
                </div>
              )}
              {activeChapter?.brief?.summary && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 mb-1">요약</h4>
                  <p className="text-sm text-gray-700">{activeChapter.brief.summary}</p>
                </div>
              )}
              {!activeChapter?.brief && (
                <p className="text-xs text-gray-400">요약 정보가 없습니다.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
