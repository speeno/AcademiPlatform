'use client';

import { RefreshCcw } from 'lucide-react';
import { BrandButton } from '@/components/ui/brand-button';
import { PageHeader } from '@/components/layout/PageHeader';
import { useCmsWorkspace } from './_useCmsWorkspace';
import { CmsLessonTree } from './CmsLessonTree';
import { CmsContentEditor } from './CmsContentEditor';
import { CmsCollaboratorPanel } from './CmsCollaboratorPanel';

export default function CmsInstructorPage() {
  const ws = useCmsWorkspace();

  if (ws.loading) return <div className="text-sm text-muted-foreground p-4">불러오는 중...</div>;

  return (
    <div className="space-y-4">
      <PageHeader
        title="강사용 콘텐츠 CMS"
        description="담당/협업 강의 콘텐츠 작성 및 검수 요청"
        actions={
          <BrandButton size="sm" variant="outline" onClick={() => ws.selectedCourseId && ws.loadTree(ws.selectedCourseId)}>
            <RefreshCcw className="w-4 h-4 mr-1" />새로고침
          </BrandButton>
        }
      />

      <div className="flex gap-2">
        <select
          className="border rounded-lg px-3 py-2 text-sm bg-white min-w-72"
          value={ws.selectedCourseId}
          onChange={(e) => ws.setSelectedCourseId(e.target.value)}
        >
          {ws.courses.map((course) => (
            <option key={course.id} value={course.id}>{course.title}</option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-[300px_1fr] gap-4">
        <CmsLessonTree
          modules={ws.tree?.modules ?? []}
          selectedLessonId={ws.selectedLessonId}
          onSelectLesson={ws.setSelectedLessonId}
        />
        <CmsContentEditor
          lessonTitle={ws.selectedLesson?.title}
          contentType={ws.contentType}
          onContentTypeChange={ws.setContentType}
          changeNote={ws.changeNote}
          onChangeNoteChange={ws.setChangeNote}
          youtubeUrl={ws.youtubeUrl}
          onYoutubeUrlChange={ws.setYoutubeUrl}
          videoUrl={ws.videoUrl}
          onVideoUrlChange={ws.setVideoUrl}
          documentNote={ws.documentNote}
          onDocumentNoteChange={ws.setDocumentNote}
          htmlContent={ws.htmlContent}
          onHtmlContentChange={ws.setHtmlContent}
          packageUploading={ws.packageUploading}
          packageUploadProgress={ws.packageUploadProgress}
          packageResult={ws.packageResult}
          history={ws.history}
          onSave={ws.handleSave}
          onReviewRequest={ws.requestReview}
          onUploadAsset={ws.handleUploadAsset}
          onPackageUpload={ws.handlePackageUpload}
        />
      </div>

      {ws.isOperator && (
        <CmsCollaboratorPanel
          tree={ws.tree}
          instructors={ws.instructors}
          instructorsLoading={ws.instructorsLoading}
          ownerUserId={ws.ownerUserId}
          ownerSelectRef={ws.ownerSelectRef}
          collaboratorUserId={ws.collaboratorUserId}
          collaboratorRole={ws.collaboratorRole}
          onOwnerUserIdChange={ws.setOwnerUserId}
          onCollaboratorUserIdChange={ws.setCollaboratorUserId}
          onCollaboratorRoleChange={ws.setCollaboratorRole}
          onSetCourseOwner={ws.setCourseOwner}
          onAddCollaborator={ws.addCollaborator}
          onRemoveCollaborator={ws.removeCollaborator}
        />
      )}
    </div>
  );
}
