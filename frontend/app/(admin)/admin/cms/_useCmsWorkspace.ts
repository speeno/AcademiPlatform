'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { API_BASE } from '@/lib/api-base';
import { buildAuthHeader } from '@/lib/auth';
import { sanitizeCmsHtml } from '@/lib/html-sanitize';
import type {
  CmsCourse, CmsTree, CmsHistoryItem, ContentType, CollaboratorRole,
  InstructorOption, PackageChapter,
} from './_types';

export function useCmsWorkspace() {
  const [courses, setCourses] = useState<CmsCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [tree, setTree] = useState<CmsTree | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [contentType, setContentType] = useState<ContentType>('VIDEO_YOUTUBE');
  const [changeNote, setChangeNote] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [documentNote, setDocumentNote] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<CmsHistoryItem[]>([]);
  const [isOperator, setIsOperator] = useState(false);
  const [ownerUserId, setOwnerUserId] = useState('');
  const [collaboratorUserId, setCollaboratorUserId] = useState('');
  const [collaboratorRole, setCollaboratorRole] = useState<CollaboratorRole>('EDITOR');
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [instructorsLoading, setInstructorsLoading] = useState(false);
  const [packageUploading, setPackageUploading] = useState(false);
  const [packageUploadProgress, setPackageUploadProgress] = useState(0);
  const [packageResult, setPackageResult] = useState<{ chapters: PackageChapter[] } | null>(null);
  const ownerSelectRef = useRef<HTMLSelectElement | null>(null);

  const selectedLesson = useMemo(
    () => tree?.modules.flatMap((m) => m.lessons).find((l) => l.id === selectedLessonId) ?? null,
    [tree, selectedLessonId],
  );

  const loadCourses = useCallback(async () => {
    const res = await fetch(`${API_BASE}/cms/courses/my`, { headers: buildAuthHeader(false), credentials: 'include' });
    const data = await res.json().catch(() => []);
    if (!res.ok) throw new Error('CMS 강의 목록을 불러오지 못했습니다.');
    const list: CmsCourse[] = Array.isArray(data) ? data : [];
    setCourses(list);
    if (list.length > 0) {
      const queryCourseId = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('courseId') ?? ''
        : '';
      const matched = queryCourseId && list.some((c) => c.id === queryCourseId);
      setSelectedCourseId((prev) => prev || (matched ? queryCourseId : list[0].id));
    }
  }, []);

  const loadMe = async () => {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: buildAuthHeader(false), credentials: 'include' });
    if (!res.ok) return;
    const me = await res.json();
    setIsOperator(me?.role === 'OPERATOR' || me?.role === 'SUPER_ADMIN');
  };

  const loadInstructors = useCallback(async () => {
    setInstructorsLoading(true);
    try {
      const params = new URLSearchParams({ role: 'INSTRUCTOR', status: 'ACTIVE', limit: '200' });
      const res = await fetch(`${API_BASE}/admin/users?${params}`, { headers: buildAuthHeader(false), credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? '강사 목록을 불러오지 못했습니다.');
      const users = Array.isArray(data?.users) ? data.users : [];
      setInstructors(users.map((u: { id: string; name: string | null; email: string | null; status: string }) => ({
        id: u.id, name: u.name ?? '', email: u.email ?? '', status: u.status ?? '',
      })));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '강사 목록 조회 실패');
    } finally {
      setInstructorsLoading(false);
    }
  }, []);

  const loadTree = useCallback(async (courseId: string) => {
    if (!courseId) return;
    const res = await fetch(`${API_BASE}/cms/courses/${courseId}/tree`, { headers: buildAuthHeader(false), credentials: 'include' });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message ?? '강의 트리를 불러오지 못했습니다.');
    setTree(data);
    const firstLesson = data?.modules?.[0]?.lessons?.[0];
    if (firstLesson) setSelectedLessonId((prev) => prev || firstLesson.id);
  }, []);

  const loadLessonContent = useCallback(async (lessonId: string) => {
    if (!lessonId) return;
    const res = await fetch(`${API_BASE}/cms/lessons/${lessonId}/content`, { headers: buildAuthHeader(false), credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message ?? '레슨 콘텐츠를 불러오지 못했습니다.');
    const latest = data?.item?.versions?.[0];
    const schema = latest?.schemaJson ?? {};
    const rawType: string = data?.item?.contentType ?? 'VIDEO_YOUTUBE';
    const nextType: ContentType = (['VIDEO_MP4', 'VIDEO_YOUTUBE', 'DOCUMENT', 'HTML', 'COURSE_PACKAGE'].includes(rawType)
      ? rawType : 'VIDEO_YOUTUBE') as ContentType;
    setContentType(nextType);
    setYoutubeUrl(schema?.youtubeUrl ?? '');
    setHtmlContent(schema?.html ?? '');
    setVideoUrl(schema?.videoUrl ?? '');
    setDocumentNote(schema?.note ?? '');
    if (nextType === 'COURSE_PACKAGE' && schema?.chapters) {
      setPackageResult({
        chapters: (schema.chapters as Array<Record<string, unknown>>).map((ch) => ({
          chapterId: (ch.chapterId as string) ?? '',
          title: (ch.title as string) ?? '',
          hasVideo: !!ch.videoStorageKey,
          hasSubtitle: !!ch.subtitleStorageKey,
          hasScript: !!ch.script && Object.keys(ch.script as Record<string, unknown>).length > 0,
          hasQuiz: !!ch.quiz && Object.keys(ch.quiz as Record<string, unknown>).length > 0,
        })),
      });
    } else {
      setPackageResult(null);
    }
    const historyRes = await fetch(`${API_BASE}/cms/lessons/${lessonId}/history`, { headers: buildAuthHeader(false), credentials: 'include' });
    const historyData = await historyRes.json().catch(() => []);
    if (historyRes.ok && Array.isArray(historyData)) setHistory(historyData);
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try { await Promise.all([loadCourses(), loadMe()]); }
      catch (err) { toast.error(err instanceof Error ? err.message : '초기화에 실패했습니다.'); }
      finally { setLoading(false); }
    };
    init();
  }, [loadCourses]);

  useEffect(() => {
    if (!isOperator) return;
    loadInstructors().catch(() => {});
  }, [isOperator, loadInstructors]);

  useEffect(() => {
    if (!ownerUserId && instructors.length > 0) setOwnerUserId(instructors[0].id);
    if (!collaboratorUserId && instructors.length > 0) setCollaboratorUserId(instructors[0].id);
  }, [instructors, ownerUserId, collaboratorUserId]);

  useEffect(() => {
    if (instructors.length === 0) return;
    const available = instructors.filter((i) => !tree?.cmsCollaborators.some((c) => c.user.id === i.id));
    if (available.length === 0) { setCollaboratorUserId(''); return; }
    if (!available.some((i) => i.id === collaboratorUserId)) setCollaboratorUserId(available[0].id);
  }, [instructors, tree, collaboratorUserId]);

  useEffect(() => {
    if (!selectedCourseId) return;
    loadTree(selectedCourseId).catch((err) => toast.error(err instanceof Error ? err.message : '강의 트리 조회 실패'));
  }, [selectedCourseId, loadTree]);

  useEffect(() => {
    if (!selectedLessonId) return;
    loadLessonContent(selectedLessonId).catch((err) => toast.error(err instanceof Error ? err.message : '콘텐츠 조회 실패'));
  }, [selectedLessonId, loadLessonContent]);

  const buildSchema = () => {
    if (contentType === 'VIDEO_YOUTUBE') return { youtubeUrl };
    if (contentType === 'VIDEO_MP4') return { videoUrl };
    if (contentType === 'HTML') return { html: sanitizeCmsHtml(htmlContent) };
    return { note: documentNote };
  };

  const handleSave = async (): Promise<void> => {
    if (!selectedLessonId) { toast.error('레슨을 선택하세요.'); return; }
    const res = await fetch(`${API_BASE}/cms/lessons/${selectedLessonId}/content`, {
      method: 'POST', headers: buildAuthHeader(), credentials: 'include',
      body: JSON.stringify({ contentType, schemaJson: buildSchema(), changeNote: changeNote || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message ?? '저장에 실패했습니다.');
    toast.success('콘텐츠가 저장되었습니다.');
    await loadTree(selectedCourseId);
    await loadLessonContent(selectedLessonId);
  };

  const handleUploadAsset = async (file: File | null) => {
    if (!file || !selectedCourseId || !selectedLessonId) return;
    try {
      const presignedRes = await fetch(`${API_BASE}/cms/assets/upload-url`, {
        method: 'POST', headers: buildAuthHeader(), credentials: 'include',
        body: JSON.stringify({ courseId: selectedCourseId, lessonId: selectedLessonId, fileName: file.name, contentType: file.type || 'application/octet-stream' }),
      });
      const presigned = await presignedRes.json().catch(() => ({}));
      if (!presignedRes.ok) throw new Error(presigned?.message ?? '업로드 URL 발급 실패');
      const uploadRes = await fetch(presigned.presignedUrl, { method: 'PUT', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file });
      if (!uploadRes.ok) throw new Error('파일 업로드 실패');
      const attachRes = await fetch(`${API_BASE}/cms/lessons/${selectedLessonId}/assets`, {
        method: 'POST', headers: buildAuthHeader(), credentials: 'include',
        body: JSON.stringify({ assetType: contentType, mimeType: file.type || 'application/octet-stream', storageKey: presigned.storageKey, publicUrl: presigned.presignedUrl.split('?')[0], fileName: file.name, fileSize: file.size }),
      });
      const attachData = await attachRes.json().catch(() => ({}));
      if (!attachRes.ok) throw new Error(attachData?.message ?? '에셋 연결 실패');
      if (contentType === 'VIDEO_MP4') setVideoUrl(attachData?.publicUrl ?? presigned.presignedUrl.split('?')[0]);
      toast.success('에셋 업로드 완료');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '업로드에 실패했습니다.');
    }
  };

  const requestReview = async () => {
    if (!selectedLessonId) return;
    const res = await fetch(`${API_BASE}/cms/lessons/${selectedLessonId}/review-request`, { method: 'POST', headers: buildAuthHeader(), credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message ?? '검수 요청 실패');
    toast.success('검수 요청을 보냈습니다.');
    await loadTree(selectedCourseId);
  };

  const addCollaborator = async () => {
    if (!selectedCourseId || !collaboratorUserId) return;
    const res = await fetch(`${API_BASE}/cms/courses/${selectedCourseId}/collaborators`, {
      method: 'POST', headers: buildAuthHeader(), credentials: 'include',
      body: JSON.stringify({ userId: collaboratorUserId, role: collaboratorRole }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message ?? '공동편집자 추가 실패');
    toast.success('공동편집자를 추가했습니다.');
    setCollaboratorUserId('');
    await loadTree(selectedCourseId);
  };

  const setCourseOwner = async (ownerId?: string) => {
    const targetOwnerId = ownerId ?? ownerSelectRef.current?.value ?? ownerUserId;
    if (!selectedCourseId || !targetOwnerId) return;
    const res = await fetch(`${API_BASE}/cms/courses/${selectedCourseId}/owner`, {
      method: 'PATCH', headers: buildAuthHeader(), credentials: 'include',
      body: JSON.stringify({ ownerUserId: targetOwnerId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message ?? '담당 강사 지정 실패');
    toast.success('담당 강사를 지정했습니다.');
    setOwnerUserId(targetOwnerId);
    await loadTree(selectedCourseId);
  };

  const removeCollaborator = async (userId: string) => {
    const res = await fetch(`${API_BASE}/cms/courses/${selectedCourseId}/collaborators/${userId}`, { method: 'DELETE', headers: buildAuthHeader(false), credentials: 'include' });
    if (!res.ok) throw new Error('공동편집자 삭제 실패');
    toast.success('공동편집자를 삭제했습니다.');
    await loadTree(selectedCourseId);
  };

  const handlePackageUpload = async (file: File | null) => {
    if (!file || !selectedLessonId) return;
    if (!file.name.endsWith('.zip')) return void toast.error('ZIP 파일만 업로드할 수 있습니다.');
    setPackageUploading(true);
    setPackageUploadProgress(10);
    setPackageResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      setPackageUploadProgress(30);
      const res = await fetch(`${API_BASE}/cms/lessons/${selectedLessonId}/course-package`, { method: 'POST', headers: buildAuthHeader(false), credentials: 'include', body: formData });
      setPackageUploadProgress(80);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? '패키지 업로드에 실패했습니다.');
      setPackageResult({ chapters: data.chapters ?? [] });
      setPackageUploadProgress(100);
      toast.success(`강의 패키지가 업로드되었습니다. (${data.chapters?.length ?? 0}개 챕터)`);
      await loadTree(selectedCourseId);
      await loadLessonContent(selectedLessonId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '패키지 업로드에 실패했습니다.');
    } finally {
      setPackageUploading(false);
    }
  };

  return {
    courses, selectedCourseId, setSelectedCourseId,
    tree, selectedLessonId, setSelectedLessonId, selectedLesson,
    contentType, setContentType, changeNote, setChangeNote,
    youtubeUrl, setYoutubeUrl, htmlContent, setHtmlContent,
    documentNote, setDocumentNote, videoUrl, setVideoUrl,
    loading, history, isOperator,
    ownerUserId, setOwnerUserId, ownerSelectRef,
    collaboratorUserId, setCollaboratorUserId,
    collaboratorRole, setCollaboratorRole,
    instructors, instructorsLoading,
    packageUploading, packageUploadProgress, packageResult,
    loadTree, handleSave, handleUploadAsset, requestReview,
    addCollaborator, setCourseOwner, removeCollaborator, handlePackageUpload,
  };
}
