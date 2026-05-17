import { Upload, Save, Send } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { HtmlWysiwygEditor } from '@/components/cms/HtmlWysiwygEditor';
import { toast } from 'sonner';
import type { ContentType, CmsHistoryItem, PackageChapter } from './_types';

interface Props {
  lessonTitle: string | undefined;
  contentType: ContentType;
  onContentTypeChange: (v: ContentType) => void;
  changeNote: string;
  onChangeNoteChange: (v: string) => void;
  youtubeUrl: string;
  onYoutubeUrlChange: (v: string) => void;
  videoUrl: string;
  onVideoUrlChange: (v: string) => void;
  documentNote: string;
  onDocumentNoteChange: (v: string) => void;
  htmlContent: string;
  onHtmlContentChange: (v: string) => void;
  packageUploading: boolean;
  packageUploadProgress: number;
  packageResult: { chapters: PackageChapter[] } | null;
  history: CmsHistoryItem[];
  onSave: () => Promise<void>;
  onReviewRequest: () => Promise<void>;
  onUploadAsset: (file: File | null) => Promise<void>;
  onPackageUpload: (file: File | null) => Promise<void>;
}

export function CmsContentEditor({
  lessonTitle, contentType, onContentTypeChange,
  changeNote, onChangeNoteChange,
  youtubeUrl, onYoutubeUrlChange,
  videoUrl, onVideoUrlChange,
  documentNote, onDocumentNoteChange,
  htmlContent, onHtmlContentChange,
  packageUploading, packageUploadProgress, packageResult,
  history, onSave, onReviewRequest, onUploadAsset, onPackageUpload,
}: Props) {
  return (
    <div className="bg-white rounded-xl border p-4 space-y-3">
      <p className="text-sm font-semibold text-foreground">{lessonTitle ?? '레슨 선택'}</p>
      <div className="grid md:grid-cols-2 gap-3">
        <select className="border rounded-lg px-3 py-2 text-sm bg-white" value={contentType} onChange={(e) => onContentTypeChange(e.target.value as ContentType)}>
          <option value="VIDEO_MP4">VIDEO_MP4</option>
          <option value="VIDEO_YOUTUBE">VIDEO_YOUTUBE</option>
          <option value="DOCUMENT">DOCUMENT</option>
          <option value="HTML">HTML</option>
          <option value="COURSE_PACKAGE">COURSE_PACKAGE (강의 패키지)</option>
        </select>
        <input className="border rounded-lg px-3 py-2 text-sm" placeholder="변경 메모" value={changeNote} onChange={(e) => onChangeNoteChange(e.target.value)} />
      </div>

      {contentType === 'VIDEO_YOUTUBE' && (
        <input className="border rounded-lg px-3 py-2 text-sm w-full" placeholder="YouTube URL" value={youtubeUrl} onChange={(e) => onYoutubeUrlChange(e.target.value)} />
      )}
      {contentType === 'VIDEO_MP4' && (
        <>
          <input className="border rounded-lg px-3 py-2 text-sm w-full" placeholder="영상 URL(업로드 후 자동 입력 가능)" value={videoUrl} onChange={(e) => onVideoUrlChange(e.target.value)} />
          <label className="inline-flex items-center text-sm px-3 py-2 border rounded-lg cursor-pointer hover:bg-muted/30">
            <Upload className="w-4 h-4 mr-1" />mp4 업로드
            <input type="file" accept="video/mp4,video/*" className="hidden" onChange={(e) => onUploadAsset(e.target.files?.[0] ?? null)} />
          </label>
        </>
      )}
      {contentType === 'DOCUMENT' && (
        <>
          <textarea className="border rounded-lg px-3 py-2 text-sm w-full min-h-24" placeholder="문서 설명/노트" value={documentNote} onChange={(e) => onDocumentNoteChange(e.target.value)} />
          <label className="inline-flex items-center text-sm px-3 py-2 border rounded-lg cursor-pointer hover:bg-muted/30">
            <Upload className="w-4 h-4 mr-1" />문서 업로드(PDF/HTML/이미지)
            <input type="file" accept=".pdf,.html,.htm,image/*" className="hidden" onChange={(e) => onUploadAsset(e.target.files?.[0] ?? null)} />
          </label>
        </>
      )}
      {contentType === 'HTML' && (
        <HtmlWysiwygEditor value={htmlContent} onChange={onHtmlContentChange} maxImageSizeMb={2} />
      )}
      {contentType === 'COURSE_PACKAGE' && (
        <div className="space-y-3">
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">강의 패키지 ZIP 파일을 업로드하세요</p>
            <p className="text-xs text-muted-foreground mb-3">chapters.json, 챕터별 동영상·자막·스크립트·퀴즈 포함</p>
            <label className={`inline-flex items-center text-sm px-4 py-2 rounded-lg cursor-pointer ${packageUploading ? 'bg-muted text-muted-foreground' : 'bg-brand-blue text-white hover:bg-brand-blue/90'}`}>
              <Upload className="w-4 h-4 mr-2" />
              {packageUploading ? '업로드 중...' : 'ZIP 파일 선택'}
              <input type="file" accept=".zip,application/zip" className="hidden" disabled={packageUploading} onChange={(e) => onPackageUpload(e.target.files?.[0] ?? null)} />
            </label>
          </div>
          {packageUploading && (
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-brand-blue h-2 rounded-full transition-all" style={{ width: `${packageUploadProgress}%` }} />
            </div>
          )}
          {packageResult && (
            <div className="border rounded-xl p-3 space-y-2">
              <p className="text-sm font-semibold text-green-700">업로드 완료: {packageResult.chapters.length}개 챕터</p>
              <div className="max-h-48 overflow-auto space-y-1">
                {packageResult.chapters.map((ch) => (
                  <div key={ch.chapterId} className="flex items-center gap-2 text-xs border rounded px-2 py-1">
                    <span className="font-medium text-foreground flex-1">{ch.title}</span>
                    <span className={ch.hasVideo ? 'text-green-600' : 'text-muted-foreground'}>영상{ch.hasVideo ? '✓' : '✗'}</span>
                    <span className={ch.hasSubtitle ? 'text-green-600' : 'text-muted-foreground'}>자막{ch.hasSubtitle ? '✓' : '✗'}</span>
                    <span className={ch.hasScript ? 'text-green-600' : 'text-muted-foreground'}>스크립트{ch.hasScript ? '✓' : '✗'}</span>
                    <span className={ch.hasQuiz ? 'text-green-600' : 'text-muted-foreground'}>퀴즈{ch.hasQuiz ? '✓' : '✗'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <BrandButton size="sm" variant="secondary" onClick={() => onSave().catch((err: unknown) => toast.error(err instanceof Error ? err.message : '저장 실패'))}>
          <Save className="w-4 h-4 mr-1" />임시저장
        </BrandButton>
        <BrandButton size="sm" onClick={() => onReviewRequest().catch((err: unknown) => toast.error(err instanceof Error ? err.message : '검수요청 실패'))}>
          <Send className="w-4 h-4 mr-1" />검수요청
        </BrandButton>
      </div>

      <div className="border-t pt-3">
        <p className="text-xs font-semibold text-muted-foreground mb-2">이력</p>
        <div className="max-h-40 overflow-auto space-y-1">
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground">이력이 없습니다.</p>
          ) : (
            history.map((h) => (
              <div key={h.id} className="text-xs text-muted-foreground border rounded px-2 py-1">
                <p className="font-medium">{h.action}</p>
                <p>{h.actor?.name ?? '시스템'} | {new Date(h.createdAt).toLocaleString('ko-KR')}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
