export type ContentType = 'VIDEO_MP4' | 'VIDEO_YOUTUBE' | 'DOCUMENT' | 'HTML' | 'COURSE_PACKAGE';
export type CollaboratorRole = 'EDITOR' | 'ASSISTANT';

export interface CmsCourse {
  id: string;
  title: string;
  slug: string;
}

export interface CmsTreeLesson {
  id: string;
  title: string;
  lessonType: string;
  contentItem?: { status: string; contentType: string; latestVersionNo: number; publishedVersionNo?: number | null } | null;
}

export interface CmsTreeModule {
  id: string;
  title: string;
  lessons: CmsTreeLesson[];
}

export interface CmsTree {
  id: string;
  title: string;
  modules: CmsTreeModule[];
  cmsCollaborators: Array<{ id: string; role: CollaboratorRole; user: { id: string; name: string; email: string } }>;
}

export interface CmsHistoryItem {
  id: string;
  action: string;
  createdAt: string;
  actor?: { id: string; name: string; email: string } | null;
}

export interface InstructorOption {
  id: string;
  name: string;
  email: string;
  status: string;
}

export interface PackageChapter {
  chapterId: string;
  title: string;
  hasVideo: boolean;
  hasSubtitle: boolean;
  hasScript: boolean;
  hasQuiz: boolean;
}
